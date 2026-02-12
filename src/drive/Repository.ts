import { QueryResult } from 'pg';
import { DataBase } from './DataBase';

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
    const [columns, values] = this.extract_columns_and_values(data);

    const result = await this.db.query(
      `INSERT INTO ${this.entity_name} (${columns.join(', ')}) VALUES (${values.join(', ')}) RETURNING id`,
    );
    const row = this.extract_single_result(result);
    if ('id' in row && row.id) {
      return { id: row.id as InstanceType<C>['id'] };
    }
    return { id: undefined };
  }

  async updateById(id: InstanceType<C>['id'], data: Partial<InstanceType<C>>) {
    const update_values = Object.entries(data).map(([k, v]) => k + ' = ' + this.toString(v));
    const result = await this.db.query(
      `UPDATE ${this.entity_name} SET ${update_values.join(', ')} WHERE id = $1 RETURNING id`,
      [id],
    );
    return this.extract_affected_ids(result);
  }

  async deleteById(id: string) {
    const result = await this.db.query(
      `DELETE FROM ${this.entity_name} WHERE id = $1 RETURNING id`,
      [id],
    );
    return this.extract_affected_ids(result);
  }

  async findOneById(id: string) {
    const result = await this.db.query(`SELECT * FROM ${this.entity_name} WHERE id = $1`, [id]);
    return this.extract_single_result(result);
  }

  async findAll() {
    const result = await this.db.query(`SELECT * FROM ${this.entity_name}`);
    return (result.rows ?? null) as Array<InstanceType<C>>;
  }

  private toString(val: unknown) {
    if (typeof val !== 'string') return val;
    return `'${String(val)}'`;
  }

  private extract_columns_and_values(data: InstanceType<C>): [string[], unknown[]] {
    const result: { columns: Array<string>; values: Array<unknown> } = { columns: [], values: [] };

    for (const item of Object.entries(data)) {
      result.columns.push(item[0]);
      result.values.push(this.toString(item[1]));
    }

    return [result.columns, result.values];
  }

  private extract_single_result(result: QueryResult<any>) {
    const first_row = result.rows?.[0] ?? null;
    return first_row as InstanceType<C>;
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
