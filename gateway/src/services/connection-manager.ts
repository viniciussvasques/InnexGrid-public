import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { pool } from '../config/database';
import { backendClient } from './backend-client';

export interface Connection {
  id: string;
  connectionId: string;
  consumerAddress: string;
  providerAddress: string;
  reservationId: string;
  resourceType: string;
  amount: string;
  publicEndpoint: string;
  accessToken: string;
  status: 'active' | 'closed' | 'expired' | 'error';
  createdAt: Date;
  expiresAt: Date;
  closedAt?: Date;
}

export interface CreateConnectionDTO {
  consumerAddress: string;
  providerAddress: string;
  reservationId: string;
  resourceType: string;
  amount: string;
}

/**
 * Gerenciador de conexões consumer ↔ provider
 */
export class ConnectionManager {
  private activeConnections: Map<string, Connection> = new Map();

  /**
   * Criar conexão
   */
  async createConnection(dto: CreateConnectionDTO): Promise<Connection> {
    // Validar reserva no backend
    const reservation = await backendClient.validateReservation(dto.reservationId);
    
    if (!reservation) {
      throw new Error('Reservation not found or invalid');
    }

    if (reservation.status !== 'active') {
      throw new Error(`Reservation is not active: ${reservation.status}`);
    }

    // Verificar se provider tem túnel ativo
    const tunnelQuery = `
      SELECT provider_address
      FROM gateway_tunnels
      WHERE provider_address = $1 AND is_active = true
      LIMIT 1
    `;
    const tunnelResult = await pool.query(tunnelQuery, [dto.providerAddress]);
    
    if (tunnelResult.rows.length === 0) {
      throw new Error('Provider tunnel not found or inactive');
    }

    const connectionId = uuidv4();
    const accessToken = this.generateAccessToken();
    const publicEndpoint = `${process.env.GATEWAY_PUBLIC_URL || 'http://localhost:3002'}/api/gateway/connections/${connectionId}`;

    // Calcular expiração (baseado na reserva ou padrão de 1 hora)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const connection: Connection = {
      id: uuidv4(),
      connectionId,
      consumerAddress: dto.consumerAddress,
      providerAddress: dto.providerAddress,
      reservationId: dto.reservationId,
      resourceType: dto.resourceType,
      amount: dto.amount,
      publicEndpoint,
      accessToken,
      status: 'active',
      createdAt: new Date(),
      expiresAt,
    };

    // Salvar no banco
    await this.saveConnection(connection);

    // Adicionar ao cache
    this.activeConnections.set(connectionId, connection);

    logger.info('Connection created', {
      connectionId,
      consumerAddress: dto.consumerAddress,
      providerAddress: dto.providerAddress,
    });

    return connection;
  }

  /**
   * Obter conexão
   */
  async getConnection(connectionId: string): Promise<Connection | null> {
    // Verificar cache primeiro
    const cached = this.activeConnections.get(connectionId);
    if (cached) {
      return cached;
    }

    // Buscar no banco
    const query = `
      SELECT 
        id,
        connection_id as "connectionId",
        consumer_address as "consumerAddress",
        provider_address as "providerAddress",
        reservation_id as "reservationId",
        resource_type as "resourceType",
        amount,
        public_endpoint as "publicEndpoint",
        access_token as "accessToken",
        status,
        created_at as "createdAt",
        expires_at as "expiresAt",
        closed_at as "closedAt"
      FROM gateway_connections
      WHERE connection_id = $1
    `;

    const result = await pool.query(query, [connectionId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const connection = this.mapRowToConnection(result.rows[0]);
    this.activeConnections.set(connectionId, connection);
    
    return connection;
  }

  /**
   * Validar token de acesso
   */
  async validateAccessToken(connectionId: string, token: string): Promise<boolean> {
    const connection = await this.getConnection(connectionId);
    
    if (!connection) {
      return false;
    }

    if (connection.status !== 'active') {
      return false;
    }

    if (new Date() > connection.expiresAt) {
      await this.closeConnection(connectionId, 'expired');
      return false;
    }

    return connection.accessToken === token;
  }

  /**
   * Fechar conexão
   */
  async closeConnection(connectionId: string, reason: 'closed' | 'expired' | 'error' = 'closed'): Promise<void> {
    const query = `
      UPDATE gateway_connections
      SET status = $1, closed_at = NOW()
      WHERE connection_id = $2
    `;

    await pool.query(query, [reason, connectionId]);
    this.activeConnections.delete(connectionId);

    logger.info('Connection closed', { connectionId, reason });
  }

  /**
   * Verificar e fechar conexões expiradas
   */
  async cleanupExpiredConnections(): Promise<number> {
    const query = `
      UPDATE gateway_connections
      SET status = 'expired', closed_at = NOW()
      WHERE status = 'active' AND expires_at < NOW()
      RETURNING connection_id
    `;

    const result = await pool.query(query);
    
    // Remover do cache
    result.rows.forEach((row) => {
      this.activeConnections.delete(row.connection_id);
    });

    if (result.rows.length > 0) {
      logger.info('Expired connections cleaned up', { count: result.rows.length });
    }

    return result.rows.length;
  }

  /**
   * Salvar conexão no banco
   */
  private async saveConnection(connection: Connection): Promise<void> {
    const query = `
      INSERT INTO gateway_connections (
        connection_id, consumer_address, provider_address,
        reservation_id, resource_type, amount,
        public_endpoint, access_token, status,
        created_at, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `;

    await pool.query(query, [
      connection.connectionId,
      connection.consumerAddress,
      connection.providerAddress,
      connection.reservationId,
      connection.resourceType,
      connection.amount,
      connection.publicEndpoint,
      connection.accessToken,
      connection.status,
      connection.createdAt,
      connection.expiresAt,
    ]);
  }

  /**
   * Mapear row do banco para Connection
   */
  private mapRowToConnection(row: any): Connection {
    return {
      id: row.id.toString(),
      connectionId: row.connectionId,
      consumerAddress: row.consumerAddress,
      providerAddress: row.providerAddress,
      reservationId: row.reservationId,
      resourceType: row.resourceType,
      amount: row.amount,
      publicEndpoint: row.publicEndpoint,
      accessToken: row.accessToken,
      status: row.status,
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
      closedAt: row.closedAt,
    };
  }

  /**
   * Gerar token de acesso
   */
  private generateAccessToken(): string {
    return uuidv4() + '-' + Date.now().toString(36);
  }
}

export const connectionManager = new ConnectionManager();

