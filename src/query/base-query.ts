import { QueryResult } from 'pg';
import { IDataBase } from 'src/interfaces/database.interface';
import { Class } from 'src/interfaces/repository.interface';

export abstract class BaseQuery<C extends Class = Class> {
  constructor(readonly entity_name: string) {}

  protected abstract build(): { query: string; params: any[] };

  async execute(db: IDataBase, params?: any) {
    const sql = this.build();
    const built = this.buildParams(sql.query, [...sql.params, params]);
    return db.query(...built);
  }

  async exec_returning_affected(db: IDataBase, params?: any) {
    const sql = this.build();
    const built = this.buildParams(sql.query, [...sql.params, params]);
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

  private buildParams(query: string, params: any[]): [string, any[]] {
    for (let i = 1; i < params.length; i++) {
      query.replace('$', `${i}`);
    }

    return [query, params];
  }
}
