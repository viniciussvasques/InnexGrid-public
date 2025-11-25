import { Router, Request, Response } from 'express';
import { tunnelManager } from '../services/tunnel-manager';
import { logger } from '../utils/logger';
import { backendClient } from '../services/backend-client';

const router = Router();

/**
 * POST /api/gateway/providers/register
 * Registrar provider no gateway
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { providerAddress, localEndpoint } = req.body;

    if (!providerAddress || !localEndpoint) {
      return res.status(400).json({
        error: 'providerAddress and localEndpoint are required',
      });
    }

    // Validar provider no backend
    try {
      await backendClient.getProvider(providerAddress);
    } catch (error) {
      logger.warn('Provider validation failed', { providerAddress, error });
      return res.status(404).json({
        error: 'Provider not found or not registered',
      });
    }

    // Criar túnel
    const tunnel = await tunnelManager.createTunnel({
      providerAddress,
      localEndpoint,
    });

    res.json({
      success: true,
      tunnel: {
        publicEndpoint: tunnel.publicEndpoint,
        connectionToken: tunnel.connectionToken,
      },
    });
  } catch (error) {
    logger.error('Failed to register provider', { error });
    res.status(500).json({
      error: 'Failed to register provider',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/gateway/providers/heartbeat
 * Atualizar heartbeat do provider
 */
router.post('/heartbeat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { providerAddress } = req.body;

    if (!providerAddress) {
      return res.status(400).json({
        error: 'providerAddress is required',
      });
    }

    await tunnelManager.updateHeartbeat(providerAddress);

    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to update heartbeat', { error });
    res.status(500).json({
      error: 'Failed to update heartbeat',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/gateway/providers/disconnect
 * Desconectar provider
 */
router.post('/disconnect', async (req: Request, res: Response): Promise<void> => {
  try {
    const { providerAddress } = req.body;

    if (!providerAddress) {
      return res.status(400).json({
        error: 'providerAddress is required',
      });
    }

    await tunnelManager.deactivateTunnel(providerAddress);

    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to disconnect provider', { error });
    res.status(500).json({
      error: 'Failed to disconnect provider',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;

