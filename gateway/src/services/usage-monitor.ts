import { logger } from '../utils/logger';
import { pool } from '../config/database';
import { backendClient } from './backend-client';

export interface UsageMetrics {
  connectionId: string;
  timestamp: Date;
  compute?: {
    cpuTime: number; // segundos
    cores: number;
  };
  storage?: {
    bytesRead: number;
    bytesWritten: number;
  };
  bandwidth?: {
    bytesIn: number;
    bytesOut: number;
  };
  cost: string; // Custo acumulado em tokens
}

export interface UsageSnapshot {
  connectionId: string;
  timestamp: Date;
  metrics: UsageMetrics;
}

/**
 * Monitor de uso de recursos
 */
export class UsageMonitor {
  private activeSnapshots: Map<string, UsageSnapshot> = new Map();
  private collectionInterval: NodeJS.Timeout | null = null;

  /**
   * Iniciar monitoramento de uma conexão
   */
  startMonitoring(connectionId: string): void {
    const snapshot: UsageSnapshot = {
      connectionId,
      timestamp: new Date(),
      metrics: {
        connectionId,
        timestamp: new Date(),
        cost: '0',
      },
    };

    this.activeSnapshots.set(connectionId, snapshot);
    logger.info('Usage monitoring started', { connectionId });
  }

  /**
   * Parar monitoramento de uma conexão
   */
  stopMonitoring(connectionId: string): void {
    this.activeSnapshots.delete(connectionId);
    logger.info('Usage monitoring stopped', { connectionId });
  }

  /**
   * Atualizar métricas de uso
   */
  updateMetrics(connectionId: string, metrics: Partial<UsageMetrics>): void {
    const snapshot = this.activeSnapshots.get(connectionId);
    if (!snapshot) {
      logger.warn('Trying to update metrics for non-monitored connection', { connectionId });
      return;
    }

    // Atualizar métricas
    if (metrics.compute) {
      snapshot.metrics.compute = {
        ...snapshot.metrics.compute,
        ...metrics.compute,
      };
    }

    if (metrics.storage) {
      snapshot.metrics.storage = {
        ...snapshot.metrics.storage,
        ...metrics.storage,
      };
    }

    if (metrics.bandwidth) {
      snapshot.metrics.bandwidth = {
        ...snapshot.metrics.bandwidth,
        ...metrics.bandwidth,
      };
    }

    if (metrics.cost) {
      snapshot.metrics.cost = metrics.cost;
    }

    snapshot.timestamp = new Date();
    snapshot.metrics.timestamp = new Date();
  }

  /**
   * Obter métricas atuais
   */
  getCurrentMetrics(connectionId: string): UsageMetrics | null {
    const snapshot = this.activeSnapshots.get(connectionId);
    return snapshot ? snapshot.metrics : null;
  }

  /**
   * Salvar métricas no banco
   */
  async saveMetrics(metrics: UsageMetrics): Promise<void> {
    const query = `
      INSERT INTO gateway_usage_metrics (
        connection_id, timestamp,
        compute_cpu_time, compute_cores,
        storage_bytes_read, storage_bytes_written,
        bandwidth_bytes_in, bandwidth_bytes_out,
        cost
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;

    await pool.query(query, [
      metrics.connectionId,
      metrics.timestamp,
      metrics.compute?.cpuTime || null,
      metrics.compute?.cores || null,
      metrics.storage?.bytesRead || null,
      metrics.storage?.bytesWritten || null,
      metrics.bandwidth?.bytesIn || null,
      metrics.bandwidth?.bytesOut || null,
      metrics.cost,
    ]);

    logger.debug('Usage metrics saved', { connectionId: metrics.connectionId });
  }

  /**
   * Registrar uso e enviar para backend
   */
  async recordUsage(connectionId: string, reservationId: string, resourceType: string): Promise<void> {
    const snapshot = this.activeSnapshots.get(connectionId);
    if (!snapshot) {
      logger.warn('Trying to record usage for non-monitored connection', { connectionId });
      return;
    }

    const metrics = snapshot.metrics;

    // Salvar no banco local
    await this.saveMetrics(metrics);

    // Enviar para backend API
    try {
      await backendClient.recordUsage({
        connectionId,
        reservationId,
        resourceType,
        metrics: {
          compute: metrics.compute,
          storage: metrics.storage,
          bandwidth: metrics.bandwidth,
        },
        cost: metrics.cost,
      });

      logger.info('Usage recorded', { connectionId, cost: metrics.cost });
    } catch (error) {
      logger.error('Failed to record usage in backend', { connectionId, error });
      // Não falhar silenciosamente - métricas já foram salvas localmente
    }
  }

  /**
   * Iniciar coleta periódica de métricas
   */
  startPeriodicCollection(intervalMs: number = 30000): void {
    if (this.collectionInterval) {
      logger.warn('Periodic collection already started');
      return;
    }

    this.collectionInterval = setInterval(async () => {
      for (const [connectionId] of this.activeSnapshots.entries()) {
        try {
          // Obter reservationId da conexão
          const connectionQuery = `
            SELECT reservation_id, resource_type
            FROM gateway_connections
            WHERE connection_id = $1
          `;
          const result = await pool.query(connectionQuery, [connectionId]);
          
          if (result.rows.length > 0) {
            const { reservation_id, resource_type } = result.rows[0];
            await this.recordUsage(connectionId, reservation_id, resource_type);
          }
        } catch (error) {
          logger.error('Error in periodic collection', { connectionId, error });
        }
      }
    }, intervalMs);

    logger.info('Periodic usage collection started', { intervalMs });
  }

  /**
   * Parar coleta periódica
   */
  stopPeriodicCollection(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
      logger.info('Periodic usage collection stopped');
    }
  }
}

export const usageMonitor = new UsageMonitor();

