import axios, { AxiosInstance } from 'axios';
import { config } from '../config/config';
import { logger } from '../utils/logger';

/**
 * Cliente para comunicação com Backend API
 */
export class BackendClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.backendApiUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para logs
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`Backend API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('Backend API Request Error', { error });
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`Backend API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error('Backend API Response Error', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Obter informações do provider
   */
  async getProvider(providerAddress: string) {
    const response = await this.client.get(`/api/providers/${providerAddress}`);
    return response.data;
  }

  /**
   * Validar reserva
   */
  async validateReservation(reservationId: string) {
    const response = await this.client.get(`/api/marketplace/reservation/${reservationId}`);
    // Backend retorna { success: true, data: {...} }
    return response.data.data || response.data;
  }

  /**
   * Registrar uso de recurso
   */
  async recordUsage(usage: {
    connectionId: string;
    reservationId: string;
    resourceType: string;
    metrics: {
      compute?: { cpuTime: number; cores: number };
      storage?: { bytesRead: number; bytesWritten: number };
      bandwidth?: { bytesIn: number; bytesOut: number };
    };
    cost: string;
  }) {
    const response = await this.client.post('/api/usage/record', usage);
    return response.data;
  }

  /**
   * Processar pagamento
   */
  async processPayment(payment: {
    connectionId: string;
    reservationId: string;
    amount: string;
    consumerAddress: string;
    providerAddress: string;
  }) {
    const response = await this.client.post('/api/payments/process', payment);
    return response.data;
  }
}

export const backendClient = new BackendClient();

