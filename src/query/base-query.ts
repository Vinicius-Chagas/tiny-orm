import { QueryResult } from 'pg';
import { IDataBase } from 'src/interfaces/database.interface';
import { Class } from 'src/interfaces/repository.interface';

export abstract class BaseQuery<C extends Class = Class> {
  constructor(readonly entity_name: string) {}

  protected abstract build(): string;

  async execute(db: IDataBase, params?: any) {
    const sql = this.build();
    return db.query(sql, params);
  }

  async exec_returning_affected(db: IDataBase, params?: any) {
    const sql = this.build();
    const result = await db.query(sql, params);
    return this.extract_affected_ids(result);
  }

  private extract_affected_ids(result: QueryResult<any>) {
    const ids = (result.rows ?? []).map((r: any) => r.id) as Array<
      InstanceType<C>['id'] | null | undefined
    >;

    const affected = ids.filter((v): v is NonNullable<InstanceType<C>['id']> => v != null);

    return { affected };
  }
}
