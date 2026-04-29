import { Pool, PoolConfig, QueryResult } from 'pg';
import { IDataBase } from 'src/interfaces/database.interface';

class DataBase implements IDataBase {
  private readonly pool: Pool;

  constructor(args: PoolConfig) {
    this.pool = new Pool(args);
  }

  async query(sql: string, params: any[] = []): Promise<QueryResult<any>> {
    // when the environment variable `DB_LOG_QUERIES` is truthy we output
    // the SQL string and parameter list to the console before executing.
    if (process.env.DB_LOG_QUERIES) {
      // use console.debug so it can be filtered but still visible ordinarily
      console.debug('DB QUERY:', sql, params.length ? params : '[]');
    }

    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return result;
    } finally {
      client.release();
    }
  }

  /**
   * Gracefully close the underlying connection pool.  Useful for
   * shutting down in tests or at application exit.
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

export { DataBase };
