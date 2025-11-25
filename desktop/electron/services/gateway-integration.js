/**
 * Gateway Integration Service
 * Gerencia conexão do app desktop com o Gateway Service
 */

const axios = require('axios');
const { app } = require('electron');
const { logger } = require('../utils/logger');

class GatewayIntegration {
  constructor() {
    this.gatewayUrl = process.env.GATEWAY_URL || 'http://localhost:3002';
    this.providerAddress = null;
    this.localEndpoint = null;
    this.connectionToken = null;
    this.isRegistered = false;
    this.heartbeatInterval = null;
    this.heartbeatIntervalMs = 30000; // 30 segundos
  }

  /**
   * Registrar provider no Gateway
   */
  async registerProvider(providerAddress, localPort) {
    try {
      this.providerAddress = providerAddress;
      this.localEndpoint = `http://localhost:${localPort}`;

      logger.info('Registering provider with Gateway', {
        providerAddress,
        localEndpoint: this.localEndpoint,
        gatewayUrl: this.gatewayUrl,
      });

      const response = await axios.post(
        `${this.gatewayUrl}/api/gateway/providers/register`,
        {
          providerAddress: this.providerAddress,
          localEndpoint: this.localEndpoint,
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        this.connectionToken = response.data.tunnel.connectionToken;
        this.isRegistered = true;

        // Iniciar heartbeat
        this.startHeartbeat();

        logger.info('Provider registered successfully', {
          publicEndpoint: response.data.tunnel.publicEndpoint,
        });

        return {
          success: true,
          publicEndpoint: response.data.tunnel.publicEndpoint,
          connectionToken: this.connectionToken,
        };
      } else {
        throw new Error('Registration failed');
      }
    } catch (error) {
      logger.error('Failed to register provider with Gateway', {
        error: error.message,
        providerAddress,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Desconectar provider do Gateway
   */
  async disconnectProvider() {
    try {
      if (!this.isRegistered || !this.providerAddress) {
        return { success: true, message: 'Not registered' };
      }

      // Parar heartbeat
      this.stopHeartbeat();

      // Desconectar do Gateway
      await axios.post(
        `${this.gatewayUrl}/api/gateway/providers/disconnect`,
        {
          providerAddress: this.providerAddress,
        },
        {
          timeout: 5000,
        }
      );

      this.isRegistered = false;
      this.connectionToken = null;

      logger.info('Provider disconnected from Gateway');

      return { success: true };
    } catch (error) {
      logger.error('Failed to disconnect provider', {
        error: error.message,
      });

      // Mesmo com erro, limpar estado local
      this.isRegistered = false;
      this.connectionToken = null;
      this.stopHeartbeat();

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Enviar heartbeat para o Gateway
   */
  async sendHeartbeat() {
    try {
      if (!this.isRegistered || !this.providerAddress) {
        return;
      }

      await axios.post(
        `${this.gatewayUrl}/api/gateway/providers/heartbeat`,
        {
          providerAddress: this.providerAddress,
          timestamp: Date.now(),
        },
        {
          timeout: 5000,
        }
      );

      logger.debug('Heartbeat sent to Gateway');
    } catch (error) {
      logger.warn('Failed to send heartbeat', {
        error: error.message,
      });

      // Se falhar várias vezes, considerar desconectado
      // (pode ser implementado um contador de falhas)
    }
  }

  /**
   * Iniciar envio periódico de heartbeat
   */
  startHeartbeat() {
    if (this.heartbeatInterval) {
      return; // Já está rodando
    }

    // Enviar primeiro heartbeat imediatamente
    this.sendHeartbeat();

    // Configurar intervalo
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, this.heartbeatIntervalMs);

    logger.info('Heartbeat started', {
      intervalMs: this.heartbeatIntervalMs,
    });
  }

  /**
   * Parar envio de heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      logger.info('Heartbeat stopped');
    }
  }

  /**
   * Obter status da conexão
   */
  getStatus() {
    return {
      isRegistered: this.isRegistered,
      providerAddress: this.providerAddress,
      localEndpoint: this.localEndpoint,
      publicEndpoint: this.isRegistered
        ? `${this.gatewayUrl}/api/gateway/tunnels/${this.providerAddress}`
        : null,
      gatewayUrl: this.gatewayUrl,
    };
  }

  /**
   * Verificar se Gateway está acessível
   */
  async checkGatewayHealth() {
    try {
      const response = await axios.get(`${this.gatewayUrl}/health`, {
        timeout: 5000,
      });

      return {
        available: true,
        status: response.data.status,
        database: response.data.database,
      };
    } catch (error) {
      logger.warn('Gateway health check failed', {
        error: error.message,
      });

      return {
        available: false,
        error: error.message,
      };
    }
  }
}

// Singleton
const gatewayIntegration = new GatewayIntegration();

module.exports = { gatewayIntegration };

