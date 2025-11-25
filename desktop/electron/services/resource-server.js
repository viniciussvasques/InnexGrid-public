/**
 * Resource Server
 * Servidor HTTP local que expõe recursos do provider
 */

const http = require('http');
const { logger } = require('../utils/logger');

class ResourceServer {
  constructor() {
    this.server = null;
    this.port = null;
    this.isRunning = false;
    this.resources = {
      compute: null,
      storage: null,
      bandwidth: null,
      memory: null,
      sensor: null,
    };
  }

  /**
   * Iniciar servidor de recursos
   */
  async start(port = 0) {
    if (this.isRunning) {
      logger.warn('Resource server already running');
      return { success: false, error: 'Server already running' };
    }

    return new Promise((resolve, reject) => {
      try {
        this.server = http.createServer((req, res) => {
          this.handleRequest(req, res);
        });

        this.server.listen(port, 'localhost', () => {
          const actualPort = this.server.address().port;
          this.port = actualPort;
          this.isRunning = true;

          logger.info('Resource server started', {
            port: actualPort,
          });

          resolve({
            success: true,
            port: actualPort,
            endpoint: `http://localhost:${actualPort}`,
          });
        });

        this.server.on('error', (error) => {
          logger.error('Resource server error', { error: error.message });
          this.isRunning = false;
          reject(error);
        });
      } catch (error) {
        logger.error('Failed to start resource server', {
          error: error.message,
        });
        reject(error);
      }
    });
  }

  /**
   * Parar servidor de recursos
   */
  async stop() {
    if (!this.isRunning || !this.server) {
      return { success: true, message: 'Server not running' };
    }

    return new Promise((resolve) => {
      this.server.close(() => {
        this.isRunning = false;
        this.port = null;
        this.server = null;

        logger.info('Resource server stopped');

        resolve({ success: true });
      });
    });
  }

  /**
   * Handler de requisições HTTP
   */
  handleRequest(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Log da requisição
    logger.debug('Resource server request', {
      method: req.method,
      url: req.url,
      headers: req.headers,
    });

    // Roteamento básico
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === '/health') {
      this.handleHealth(req, res);
    } else if (url.pathname.startsWith('/api/compute')) {
      this.handleCompute(req, res);
    } else if (url.pathname.startsWith('/api/storage')) {
      this.handleStorage(req, res);
    } else if (url.pathname.startsWith('/api/bandwidth')) {
      this.handleBandwidth(req, res);
    } else if (url.pathname.startsWith('/api/memory')) {
      this.handleMemory(req, res);
    } else {
      this.handleNotFound(req, res);
    }
  }

  /**
   * Health check
   */
  handleHealth(req, res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        server: 'resource-server',
        port: this.port,
        resources: Object.keys(this.resources).filter(
          (key) => this.resources[key] !== null
        ),
      })
    );
  }

  /**
   * Handler para recursos de compute
   */
  handleCompute(req, res) {
    // TODO: Implementar lógica de compute
    // Por enquanto, apenas retorna status
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        resource: 'compute',
        available: this.resources.compute !== null,
        message: 'Compute resource endpoint',
      })
    );
  }

  /**
   * Handler para recursos de storage
   */
  handleStorage(req, res) {
    // TODO: Implementar lógica de storage
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        resource: 'storage',
        available: this.resources.storage !== null,
        message: 'Storage resource endpoint',
      })
    );
  }

  /**
   * Handler para recursos de bandwidth
   */
  handleBandwidth(req, res) {
    // TODO: Implementar lógica de bandwidth
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        resource: 'bandwidth',
        available: this.resources.bandwidth !== null,
        message: 'Bandwidth resource endpoint',
      })
    );
  }

  /**
   * Handler para recursos de memory
   */
  handleMemory(req, res) {
    // TODO: Implementar lógica de memory
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        resource: 'memory',
        available: this.resources.memory !== null,
        message: 'Memory resource endpoint',
      })
    );
  }

  /**
   * 404 Not Found
   */
  handleNotFound(req, res) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: 'Not Found',
        path: req.url,
      })
    );
  }

  /**
   * Registrar recursos disponíveis
   */
  registerResources(resources) {
    this.resources = { ...this.resources, ...resources };
    logger.info('Resources registered', { resources: Object.keys(resources) });
  }

  /**
   * Obter status do servidor
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      port: this.port,
      endpoint: this.isRunning ? `http://localhost:${this.port}` : null,
      resources: Object.keys(this.resources).filter(
        (key) => this.resources[key] !== null
      ),
    };
  }
}

// Singleton
const resourceServer = new ResourceServer();

module.exports = { resourceServer };

