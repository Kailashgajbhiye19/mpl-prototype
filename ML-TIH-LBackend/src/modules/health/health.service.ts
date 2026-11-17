import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { dbPool } from '../../database/db.pool';

@Injectable()
export class HealthService {
  async check() {
    try {
      await dbPool.query('SELECT 1');
      return {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'disconnected',
      });
    }
  }
}
