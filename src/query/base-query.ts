import { QueryResult } from 'pg';
import { IDataBase } from 'src/interfaces/database.interface';
import { Class } from 'src/interfaces/repository.interface';

export abstract class BaseQuery<C extends Class, P> {
  constructor(readonly entity_name: string) {}

  protected abstract build(params?: P): {
    query: string;
    params: Record<string, unknown>;
  };

  async execute(db: IDataBase, params?: P) {
    const sql = this.build(params);
    const built = this.buildParams(sql.query, sql.params);
    console.log({ built });
    return db.query(...built);
  }

  async exec_returning_affected(db: IDataBase, params?: P) {
    const sql = this.build(params);
    const built = this.buildParams(sql.query, sql.params);
    const result = await db.query(...built);
    return this.extract_affected_ids(result);
  }

  private extract_affected_ids(result: QueryResult<any>) {
    const ids = (result.rows ?? []).map((r: any) => r.id) as Array<
      InstanceType<C>['id'] | null | undefined
    >;

    const affected = ids.filter((v): v is NonNullable<InstanceType<C>['id']> => v != null);

    return { affected };
  }

  private buildParams(query: string, params: Record<string, unknown>): [string, unknown[]] {
    const built_params: Array<unknown> = [];
    let built_query: string = query;
    Object.entries(params).forEach(([key, val], idx) => {
      built_query = built_query.replace(`:${key}`, `$${idx + 1}`);
      built_params[idx] = val;
    });

    return [built_query, built_params];
  }

  protected extract_from_where<T extends object>(where?: T): [string, Record<string, unknown>] {
    if (!where) return ['', {}];
    const entries = Object.entries(where);
    const query_entries: string[] = [];
    const param_values: Record<string, unknown> = {};
    entries.map(([k, v]) => {
      query_entries.push(`${String(k)} = :w${String(k)}`);
      param_values['w' + k] = v;
    });

    return [query_entries.join(' AND '), param_values];
  }
}
