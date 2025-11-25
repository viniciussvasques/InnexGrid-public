import { Pool } from 'pg';
import { config } from './config';
import { logger } from '../utils/logger';

/**
 * Pool de conexões com o banco de dados (compartilhado com backend)
 */
export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Log de conexão
pool.on('connect', () => {
  logger.debug('Database connection established');
});

pool.on('error', (err) => {
  logger.error('Database connection error', { error: err });
});

// Testar conexão
export async function testConnection(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT NOW()');
    logger.info('Database connection test successful', { time: result.rows[0].now });
    return true;
  } catch (error) {
    logger.error('Database connection test failed', { error });
    return false;
  }
}

