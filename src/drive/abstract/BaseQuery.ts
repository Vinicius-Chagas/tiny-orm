import { QueryResult } from 'pg';
import { DataBase } from '../DataBase';

export abstract class BaseQuery<C extends { id?: unknown }= any, R = QueryResult<any>> {
  constructor(readonly entity_name: string) {}

  protected abstract build(): string;

  async execute(db: DataBase): Promise<R> {
    const sql = this.build();
    return db.query(sql) as Promise<R>;
  }

  async exec_returning_affected(db: DataBase) {
    const sql = this.build();
    const result = await db.query(sql);
    return this.extract_affected_ids(result);
  }

  private extract_affected_ids(result: QueryResult<any>) {
    const ids = (result.rows ?? []).map((r: any) => r.id) as Array<
    C['id'] | null | undefined
    >;

    const affected = ids.filter((v): v is NonNullable<C['id']> => v != null);

    return { affected };
  }
}
