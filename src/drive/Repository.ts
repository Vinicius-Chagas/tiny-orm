import { QueryResult } from 'pg';
import { DataBase } from './DataBase';
import { InsertQuery } from './queries/InsertQuery';
import { FindQuery } from './queries/findQuery';
import { toString } from 'src/utils';
import { DeleteQuery } from './queries/deleteQuery';

type Class<T = any> = new (...args: any[]) => T;
class Repository<C extends Class = Class> {
  // private readonly entity: C;
  private readonly db: DataBase;
  private readonly entity_name: string;

  constructor(db: DataBase, entity: C) {
    this.db = db;
    if (typeof entity !== 'function' || !entity.prototype) {
      throw new TypeError('entity must be a class/constructor');
    }
    // this.entity = entity;
    this.entity_name = entity.name.toLowerCase();
  }

  async insert(data: InstanceType<C>): Promise<{ id: InstanceType<C>['id'] | undefined }> {
    const insert_query = new InsertQuery(this.entity_name, data);
    return await insert_query.execute(this.db);
  }

  async updateById(id: InstanceType<C>['id'], data: Partial<InstanceType<C>>) {
    const update_values = Object.entries(data).map(([k, v]) => k + ' = ' + toString(v));
    const result = await this.db.query(
      `UPDATE ${this.entity_name} SET ${update_values.join(', ')} WHERE id = $1 RETURNING id`,
      [id],
    );
    return this.extract_affected_ids(result);
  }

  async deleteById(id: string) {
    const delete_query = new DeleteQuery(this.entity_name, { where: { id }})
    return delete_query.exec_returning_affected(this.db);
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
