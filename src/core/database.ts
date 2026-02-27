import { Pool, PoolConfig, QueryResult } from 'pg';
import { IDataBase } from 'src/interfaces/database.interface';

class DataBase implements IDataBase {
  private readonly pool: Pool;

  constructor(args: PoolConfig) {
    this.pool = new Pool(args);
  }

  async query(sql: string, params: any[] = []): Promise<QueryResult<any>> {
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
