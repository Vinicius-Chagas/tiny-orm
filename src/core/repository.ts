import { InsertQuery } from '../query/insert-query';
import { FindQuery } from '../query/find-query';
import { DeleteQuery } from '../query/delete-query';
import { UpdateQuery } from '../query/update-query';
import { IDataBase } from 'src/interfaces/database.interface';
import { Class, IRepository } from 'src/interfaces/repository.interface';
import { PaginationOpts } from 'src/types/Pagination.types';

class Repository<C extends Class> implements IRepository<C> {
  private readonly db: IDataBase;
  private readonly entity_name: string;

  constructor(db: IDataBase, entity: C) {
    this.db = db;
    if (typeof entity !== 'function' || !entity.prototype) {
      throw new TypeError('entity must be a class/constructor');
    }
    this.entity_name = entity.name.toLowerCase();
  }

  async insert(data: InstanceType<C>) {
    const insert_query = new InsertQuery(this.entity_name);
    const result = await insert_query.execute(this.db, { data });
    return { id: result.rows[0]?.id as InstanceType<C>['id'] | undefined };
  }

  async updateById(id: InstanceType<C>['id'], data: Partial<InstanceType<C>>) {
    const update_query = new UpdateQuery(this.entity_name);
    return update_query.exec_returning_affected(this.db, { where: { id }, data });
  }

  async deleteById(id: string) {
    const delete_query = new DeleteQuery(this.entity_name);
    return delete_query.exec_returning_affected(this.db, { where: { id } });
  }

  async findOneById(id: string) {
    const find_query = new FindQuery(this.entity_name, 'id');
    const result = await find_query.execute(this.db, { where: { id } });
    return result.rows[0] as InstanceType<C>;
  }

  async findOne(opts?: { where: Partial<InstanceType<C>> } & PaginationOpts<C>) {
    const find_query = new FindQuery(this.entity_name, 'one');
    const result = await find_query.execute(this.db, opts);
    return result.rows[0] as InstanceType<C>;
  }

  async findAll(opts?: { where: Partial<InstanceType<C>> } & PaginationOpts<C>) {
    const find_query = new FindQuery(this.entity_name, 'all');
    const result = await find_query.execute(this.db, opts);
    return result.rows as Array<InstanceType<C>>;
  }
}

export { Repository };
