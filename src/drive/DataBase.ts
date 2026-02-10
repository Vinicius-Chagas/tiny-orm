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

  async insert(table: string, data: Record<string, unknown>) {
    const keyValues: { keys: Array<string>; values: Array<unknown> } = { keys: [], values: [] };
    Object.entries(data).forEach(([k, v]) => {
      keyValues.keys.push(k);
      keyValues.values.push(this.toString(v));
    });

    const result = await this.query(
      `INSERT INTO ${table} (${keyValues.keys.join(', ')}) VALUES (${keyValues.values.join(', ')}) RETURNING id`,
    );
    return result.rows;
  }

  async updateById(table: string, id: string, data: Record<string, unknown>) {
    const update_values = Object.entries(data).map(([k, v]) => k + ' = ' + this.toString(v));
    const result = await this.query(
      `UPDATE ${table} SET ${update_values.join(', ')} WHERE id = $1`,
      [id],
    );
    return result.rows;
  }

  async deleteById(table: string, id: string) {
    const result = await this.query(`DELETE FROM ${table} WHERE id = $1 RETURNING id`, [id]);
    return result.rows;
  }

  async findById(table: string, id: string) {
    const result = await this.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
    return result.rows;
  }
  private toString(val: unknown) {
    if (typeof val !== 'string') return val;
    return `'${String(val)}'`;
  }
}

export { DataBase };
