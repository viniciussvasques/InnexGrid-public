import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { config } from '../config/config';
import { pool } from '../config/database';

export interface Tunnel {
  id: string;
  providerAddress: string;
  localEndpoint: string;
  publicEndpoint: string;
  connectionToken: string;
  isActive: boolean;
  createdAt: Date;
  lastHeartbeat: Date;
}

export interface CreateTunnelDTO {
  providerAddress: string;
  localEndpoint: string;
}

/**
 * Gerenciador de túneis reversos
 */
export class TunnelManager {
  private activeTunnels: Map<string, Tunnel> = new Map();

  /**
   * Criar túnel para provider
   */
  async createTunnel(dto: CreateTunnelDTO): Promise<Tunnel> {
    const connectionToken = this.generateConnectionToken();
    const publicEndpoint = `${config.gatewayPublicUrl}/api/gateway/tunnels/${dto.providerAddress}`;

    // Desativar túneis anteriores do mesmo provider
    await this.deactivateProviderTunnels(dto.providerAddress);

    const tunnel: Tunnel = {
      id: uuidv4(),
      providerAddress: dto.providerAddress,
      localEndpoint: dto.localEndpoint,
      publicEndpoint,
      connectionToken,
      isActive: true,
      createdAt: new Date(),
      lastHeartbeat: new Date(),
    };

    // Salvar no banco
    await this.saveTunnel(tunnel);

    // Adicionar ao cache
    this.activeTunnels.set(dto.providerAddress, tunnel);

    logger.info('Tunnel created', {
      providerAddress: dto.providerAddress,
      publicEndpoint: tunnel.publicEndpoint,
    });

    return tunnel;
  }

  /**
   * Obter túnel ativo do provider
   */
  async getActiveTunnel(providerAddress: string): Promise<Tunnel | null> {
    // Verificar cache primeiro
    const cached = this.activeTunnels.get(providerAddress);
    if (cached && cached.isActive) {
      return cached;
    }

    // Buscar no banco
    const query = `
      SELECT 
        id,
        provider_address as "providerAddress",
        local_endpoint as "localEndpoint",
        public_endpoint as "publicEndpoint",
        connection_token as "connectionToken",
        is_active as "isActive",
        created_at as "createdAt",
        last_heartbeat as "lastHeartbeat"
      FROM gateway_tunnels
      WHERE provider_address = $1 AND is_active = true
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [providerAddress]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const tunnel = this.mapRowToTunnel(result.rows[0]);
    this.activeTunnels.set(providerAddress, tunnel);
    
    return tunnel;
  }

  /**
   * Atualizar heartbeat do túnel
   */
  async updateHeartbeat(providerAddress: string): Promise<void> {
    const query = `
      UPDATE gateway_tunnels
      SET last_heartbeat = NOW()
      WHERE provider_address = $1 AND is_active = true
    `;

    await pool.query(query, [providerAddress]);

    // Atualizar cache
    const tunnel = this.activeTunnels.get(providerAddress);
    if (tunnel) {
      tunnel.lastHeartbeat = new Date();
    }

    logger.debug('Heartbeat updated', { providerAddress });
  }

  /**
   * Desativar túnel
   */
  async deactivateTunnel(providerAddress: string): Promise<void> {
    const query = `
      UPDATE gateway_tunnels
      SET is_active = false
      WHERE provider_address = $1 AND is_active = true
    `;

    await pool.query(query, [providerAddress]);
    this.activeTunnels.delete(providerAddress);

    logger.info('Tunnel deactivated', { providerAddress });
  }

  /**
   * Desativar todos os túneis do provider
   */
  private async deactivateProviderTunnels(providerAddress: string): Promise<void> {
    const query = `
      UPDATE gateway_tunnels
      SET is_active = false
      WHERE provider_address = $1
    `;

    await pool.query(query, [providerAddress]);
  }

  /**
   * Salvar túnel no banco
   */
  private async saveTunnel(tunnel: Tunnel): Promise<void> {
    const query = `
      INSERT INTO gateway_tunnels (
        provider_address, local_endpoint, public_endpoint,
        connection_token, is_active, created_at, last_heartbeat
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (provider_address, is_active) 
      WHERE is_active = true
      DO UPDATE SET
        local_endpoint = EXCLUDED.local_endpoint,
        public_endpoint = EXCLUDED.public_endpoint,
        connection_token = EXCLUDED.connection_token,
        last_heartbeat = EXCLUDED.last_heartbeat
    `;

    await pool.query(query, [
      tunnel.providerAddress,
      tunnel.localEndpoint,
      tunnel.publicEndpoint,
      tunnel.connectionToken,
      tunnel.isActive,
      tunnel.createdAt,
      tunnel.lastHeartbeat,
    ]);
  }

  /**
   * Mapear row do banco para Tunnel
   */
  private mapRowToTunnel(row: any): Tunnel {
    return {
      id: row.id.toString(),
      providerAddress: row.providerAddress,
      localEndpoint: row.localEndpoint,
      publicEndpoint: row.publicEndpoint,
      connectionToken: row.connectionToken,
      isActive: row.isActive,
      createdAt: row.createdAt,
      lastHeartbeat: row.lastHeartbeat,
    };
  }

  /**
   * Gerar token de conexão
   */
  private generateConnectionToken(): string {
    return uuidv4() + '-' + Date.now().toString(36);
  }
}

export const tunnelManager = new TunnelManager();

