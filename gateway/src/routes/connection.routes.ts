import { Router, Request, Response } from 'express';
import { connectionManager } from '../services/connection-manager';
import { proxyHandler } from '../proxy/proxy-handler';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/gateway/connections
 * Criar nova conexão
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { consumerAddress, providerAddress, reservationId, resourceType, amount } = req.body;

    if (!consumerAddress || !providerAddress || !reservationId || !resourceType || !amount) {
      return res.status(400).json({
        error: 'Missing required fields: consumerAddress, providerAddress, reservationId, resourceType, amount',
      });
    }

    const connection = await connectionManager.createConnection({
      consumerAddress,
      providerAddress,
      reservationId,
      resourceType,
      amount,
    });

    res.json({
      success: true,
      connection: {
        connectionId: connection.connectionId,
        publicEndpoint: connection.publicEndpoint,
        accessToken: connection.accessToken,
        expiresAt: connection.expiresAt,
      },
    });
  } catch (error) {
    logger.error('Failed to create connection', { error });
    res.status(500).json({
      error: 'Failed to create connection',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/gateway/connections/:connectionId
 * Obter informações da conexão
 */
router.get('/:connectionId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { connectionId } = req.params;

    const connection = await connectionManager.getConnection(connectionId);
    
    if (!connection) {
      return res.status(404).json({
        error: 'Connection not found',
      });
    }

    res.json({
      connection: {
        connectionId: connection.connectionId,
        status: connection.status,
        expiresAt: connection.expiresAt,
        resourceType: connection.resourceType,
      },
    });
  } catch (error) {
    logger.error('Failed to get connection', { error });
    res.status(500).json({
      error: 'Failed to get connection',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * DELETE /api/gateway/connections/:connectionId
 * Fechar conexão
 */
router.delete('/:connectionId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { connectionId } = req.params;

    await connectionManager.closeConnection(connectionId, 'closed');

    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to close connection', { error });
    res.status(500).json({
      error: 'Failed to close connection',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * ALL /api/gateway/connections/:connectionId/*
 * Proxy de requisições para o provider
 */
router.all('/:connectionId/*', async (req: Request, res: Response, next: any) => {
  await proxyHandler.handleRequest(req, res, next);
});

export default router;

