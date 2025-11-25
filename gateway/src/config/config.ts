import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3002', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Backend API
  backendApiUrl: process.env.BACKEND_API_URL || 'http://localhost:3001',
  
  // Database (compartilhado com backend)
  databaseUrl: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/innexgrid',
  
  // Gateway Public URL
  gatewayPublicUrl: process.env.GATEWAY_PUBLIC_URL || 'http://localhost:3002',
  
  // Security
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-here',
  connectionTokenSecret: process.env.CONNECTION_TOKEN_SECRET || 'your-connection-token-secret',
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // WebSocket
  wsHeartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000', 10),
  wsTimeout: parseInt(process.env.WS_TIMEOUT || '60000', 10),
  
  // Tunnel
  tunnelMaxConnections: parseInt(process.env.TUNNEL_MAX_CONNECTIONS || '100', 10),
  tunnelHeartbeatInterval: parseInt(process.env.TUNNEL_HEARTBEAT_INTERVAL || '30000', 10),
  
  // Proxy
  proxyTimeout: parseInt(process.env.PROXY_TIMEOUT || '30000', 10),
  proxyMaxBodySize: parseInt(process.env.PROXY_MAX_BODY_SIZE || '10485760', 10), // 10MB
};

