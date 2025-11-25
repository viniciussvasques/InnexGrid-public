import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { logger } from '../utils/logger';
import { connectionManager } from '../services/connection-manager';
import { tunnelManager } from '../services/tunnel-manager';
import { usageMonitor } from '../services/usage-monitor';
import { config } from '../config/config';

/**
 * Handler de proxy para requisições consumer → provider
 */
export class ProxyHandler {
  /**
   * Middleware para validar e fazer proxy de requisições
   */
  async handleRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    const connectionId = req.params.connectionId;
    
    if (!connectionId) {
      res.status(400).json({ error: 'Connection ID is required' });
      return;
    }

    // Validar token de acesso (se fornecido)
    const accessToken = req.headers['x-access-token'] as string;
    if (accessToken) {
      const isValid = await connectionManager.validateAccessToken(connectionId, accessToken);
      if (!isValid) {
        res.status(401).json({ error: 'Invalid access token' });
        return;
      }
    }

    // Obter conexão
    const connection = await connectionManager.getConnection(connectionId);
    if (!connection) {
      res.status(404).json({ error: 'Connection not found' });
      return;
    }

    if (connection.status !== 'active') {
      res.status(403).json({ error: `Connection is ${connection.status}` });
      return;
    }

    // Verificar expiração
    if (new Date() > connection.expiresAt) {
      await connectionManager.closeConnection(connectionId, 'expired');
      res.status(403).json({ error: 'Connection expired' });
      return;
    }

    // Obter túnel do provider
    const tunnel = await tunnelManager.getActiveTunnel(connection.providerAddress);
    if (!tunnel) {
      res.status(503).json({ error: 'Provider tunnel not available' });
      return;
    }

    // Medir uso antes (bandwidth)
    const usageBefore = this.measureBandwidthUsage(req);

    // Criar proxy para o endpoint local do provider
    const proxyOptions: Options = {
      target: tunnel.localEndpoint,
      changeOrigin: true,
      pathRewrite: {
        [`^/api/gateway/connections/${connectionId}`]: '', // Remove prefixo
      },
      onProxyReq: (proxyReq, req) => {
        // Adicionar headers de identificação
        proxyReq.setHeader('X-Connection-Id', connectionId);
        proxyReq.setHeader('X-Resource-Type', connection.resourceType);
        
        logger.debug('Proxying request', {
          connectionId,
          method: req.method,
          path: req.path,
          target: tunnel.localEndpoint,
        });
      },
      onProxyRes: async (proxyRes) => {
        // Medir uso depois
        const usageAfter = this.measureBandwidthUsage(req);
        
        // Atualizar métricas de bandwidth
        usageMonitor.updateMetrics(connectionId, {
          bandwidth: {
            bytesIn: usageAfter.bytesIn - usageBefore.bytesIn,
            bytesOut: usageAfter.bytesOut - usageBefore.bytesOut,
          },
        });

        logger.debug('Proxy response', {
          connectionId,
          statusCode: proxyRes.statusCode,
        });
      },
      onError: (err, req, res) => {
        logger.error('Proxy error', {
          connectionId,
          error: err.message,
        });

        if (!res.headersSent) {
          (res as Response).status(502).json({
            error: 'Proxy error',
            message: err.message,
          });
        }
      },
      timeout: config.proxyTimeout,
      proxyTimeout: config.proxyTimeout,
    };

    // Criar e usar middleware de proxy
    const proxy = createProxyMiddleware(proxyOptions);
    proxy(req, res, next);
  }

  /**
   * Medir uso de bandwidth (simplificado)
   */
  private measureBandwidthUsage(req: Request): { bytesIn: number; bytesOut: number } {
    // Em produção, isso seria mais sofisticado
    // Por enquanto, estimar baseado no tamanho do body
    const bytesIn = req.headers['content-length'] 
      ? parseInt(req.headers['content-length'] as string, 10) 
      : 0;
    
    // bytesOut será medido na resposta
    return { bytesIn, bytesOut: 0 };
  }
}

export const proxyHandler = new ProxyHandler();

