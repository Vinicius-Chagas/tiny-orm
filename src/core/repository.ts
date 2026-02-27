import { QueryResult } from 'pg';
import { DataBase } from './database';
import { InsertQuery } from '../query/insert-query';
import { FindQuery } from '../query/find-query';
import { DeleteQuery } from '../query/delete-query';
import { UpdateQuery } from '../query/update-query';

type Class<T = any> = new (...args: any[]) => T;
class Repository<C extends Class = Class> {
  private readonly db: DataBase;
  private readonly entity_name: string;

  constructor(db: DataBase, entity: C) {
    this.db = db;
    if (typeof entity !== 'function' || !entity.prototype) {
      throw new TypeError('entity must be a class/constructor');
    }
    this.entity_name = entity.name.toLowerCase();
  }

  async insert(data: InstanceType<C>): Promise<{ id: InstanceType<C>['id'] | undefined }> {
    const insert_query = new InsertQuery(this.entity_name, data);
    return await insert_query.execute(this.db);
  }

  async updateById(id: InstanceType<C>['id'], data: Partial<InstanceType<C>>) {
    const update_query = new UpdateQuery(this.entity_name, data);
    return update_query.exec_returning_affected(this.db, {id});
  }

  async deleteById(id: string) {
    const delete_query = new DeleteQuery(this.entity_name, { where: { id }})
    return delete_query.exec_returning_affected(this.db, {id});
  }

  async findOneById(id: string) {
    const find_query = new FindQuery(this.entity_name, 'id', { where: { id } });
    return find_query.execute(this.db);
  }

  async findAll() {
    const find_query = new FindQuery(this.entity_name, 'all');
    return find_query.execute(this.db);
  }

  private extract_affected_ids(result: QueryResult<any>) {
    const ids = (result.rows ?? []).map((r) => r.id) as Array<
      InstanceType<C>['id'] | null | undefined
    >;

    const affected = ids.filter((v): v is NonNullable<InstanceType<C>['id']> => v != null);

    return { affected };
  }
}

export { Repository };
