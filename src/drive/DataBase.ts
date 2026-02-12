import { Pool, PoolConfig } from 'pg';

class DataBase {
  private readonly pool: Pool;

  constructor(args: PoolConfig) {
    this.pool = new Pool(args);
  }

  async query(sql: string, params: any[] = []) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return result;
    } finally {
      client.release();
    }
  }
}

export { DataBase };
