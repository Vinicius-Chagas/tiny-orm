import { QueryResult } from 'pg';
import { DataBase } from '../DataBase';

export abstract class BaseQuery<C = any, R = QueryResult<any>> {
  constructor(readonly entity_name: string) {}

  protected abstract build(): string;

  async execute(db: DataBase): Promise<R> {
    const sql = this.build();
    return db.query(sql) as Promise<R>;
  }
}
