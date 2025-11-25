/**
 * InnexGrid Client SDK
 * SDK para consumidores acessarem recursos de providers através do Gateway
 */

interface Connection {
  connectionId: string;
  publicEndpoint: string;
  accessToken: string;
  expiresAt: string;
}

interface Reservation {
  id: string;
  consumerAddress: string;
  providerAddress: string;
  resourceType: string;
  amount: string;
  status: string;
}

export class InnexGridClient {
  private gatewayUrl: string;
  private currentConnection: Connection | null = null;

  constructor(gatewayUrl: string = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3002') {
    this.gatewayUrl = gatewayUrl;
  }

  /**
   * Conectar a um recurso após criar uma reserva
   * @param reservationId ID da reserva criada
   * @param consumerAddress Endereço da carteira do consumer
   * @param providerAddress Endereço da carteira do provider
   * @param resourceType Tipo do recurso (compute, storage, bandwidth, memory)
   * @param amount Quantidade reservada
   */
  async connectToResource(
    reservationId: string,
    consumerAddress: string,
    providerAddress: string,
    resourceType: string,
    amount: string
  ): Promise<Connection> {
    try {
      const response = await fetch(`${this.gatewayUrl}/api/gateway/connections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consumerAddress,
          providerAddress,
          reservationId,
          resourceType,
          amount,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to create connection: ${response.statusText}`);
      }

      const data = await response.json();
      this.currentConnection = data.connection;

      return data.connection;
    } catch (error) {
      console.error('Failed to connect to resource:', error);
      throw error;
    }
  }

  /**
   * Usar recurso de compute
   */
  async executeComputeTask(task: { code?: string; input?: any; [key: string]: any }): Promise<any> {
    if (!this.currentConnection) {
      throw new Error('Not connected to resource. Call connectToResource() first.');
    }

    const response = await fetch(
      `${this.currentConnection.publicEndpoint}/resources/compute/execute`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Access-Token': this.currentConnection.accessToken,
        },
        body: JSON.stringify(task),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to execute compute task: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Usar recurso de storage
   */
  async storeData(data: Uint8Array | string, path: string): Promise<any> {
    if (!this.currentConnection) {
      throw new Error('Not connected to resource. Call connectToResource() first.');
    }

    let finalBody: BodyInit;
    if (typeof data === 'string') {
      finalBody = JSON.stringify({ data, path });
    } else if (data instanceof Uint8Array) {
      // Convert Uint8Array to ArrayBuffer for Blob constructor to satisfy TS types
      finalBody = new Blob([data.buffer as ArrayBuffer]);
    } else {
      finalBody = data as any;
    }

    const response = await fetch(
      `${this.currentConnection.publicEndpoint}/resources/storage/store`,
      {
        method: 'POST',
        headers: {
          'Content-Type': typeof data === 'string' ? 'application/json' : 'application/octet-stream',
          'X-Access-Token': this.currentConnection.accessToken,
          'X-Path': path,
        },
        body: finalBody,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to store data: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Obter informações sobre recursos disponíveis do provider
   */
  async getProviderResources(providerAddress: string): Promise<any> {
    const response = await fetch(
      `${this.gatewayUrl}/api/gateway/providers/${providerAddress}/resources`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to get provider resources: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Obter status da conexão atual
   */
  async getConnectionStatus(connectionId: string): Promise<any> {
    const response = await fetch(`${this.gatewayUrl}/api/gateway/connections/${connectionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to get connection status: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Fechar conexão
   */
  async disconnect(connectionId: string): Promise<void> {
    const response = await fetch(`${this.gatewayUrl}/api/gateway/connections/${connectionId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to disconnect: ${response.statusText}`);
    }

    this.currentConnection = null;
  }

  /**
   * Obter conexão atual
   */
  getCurrentConnection(): Connection | null {
    return this.currentConnection;
  }
}

// Export singleton instance
export const innexGridClient = new InnexGridClient();

