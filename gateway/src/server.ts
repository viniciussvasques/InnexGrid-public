import express from 'express';
import cors from 'cors';
import { config } from './config/config';
import { logger } from './utils/logger';
import { testConnection } from './config/database';
import providerRoutes from './routes/provider.routes';
import connectionRoutes from './routes/connection.routes';
import { connectionManager } from './services/connection-manager';
import { usageMonitor } from './services/usage-monitor';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', async (_req, res) => {
  const dbConnected = await testConnection();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'connected' : 'disconnected',
  });
});

// API Routes
app.use('/api/gateway/providers', providerRoutes);
app.use('/api/gateway/connections', connectionRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    service: 'InnexGrid Gateway',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      providers: '/api/gateway/providers',
      connections: '/api/gateway/connections',
    },
  });
});

// Error handling
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err });
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? err.message : undefined,
  });
});

// Iniciar servidor
const PORT = config.port;

app.listen(PORT, async () => {
  logger.info(`🚀 Gateway Service running on port ${PORT}`);
  logger.info(`📍 Health check: http://localhost:${PORT}/health`);
  logger.info(`📍 API: http://localhost:${PORT}/api/gateway`);

  // Testar conexão com banco
  const dbConnected = await testConnection();
  if (!dbConnected) {
    logger.warn('⚠️  Database connection failed - some features may not work');
  }

  // Iniciar limpeza periódica de conexões expiradas
  setInterval(async () => {
    try {
      const count = await connectionManager.cleanupExpiredConnections();
      if (count > 0) {
        logger.info(`Cleaned up ${count} expired connections`);
      }
    } catch (error) {
      logger.error('Error cleaning up expired connections', { error });
    }
  }, 60000); // A cada 1 minuto

  // Iniciar coleta periódica de métricas
  usageMonitor.startPeriodicCollection(30000); // A cada 30 segundos
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  usageMonitor.stopPeriodicCollection();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  usageMonitor.stopPeriodicCollection();
  process.exit(0);
});

export default app;

