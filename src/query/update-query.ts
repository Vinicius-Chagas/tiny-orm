import { IQueryOpts } from 'src/interfaces/query-opts.interface';
import { BaseQuery } from './base-query';
import { Class } from 'src/interfaces/repository.interface';

export class UpdateQuery<C extends Class> extends BaseQuery<C, IQueryOpts<C>> {
  constructor(public readonly entity_name: string) {
    super(entity_name);
  }

  protected build(params: IQueryOpts<C>) {
    const update_values = Object.entries(params.data).map(([k]) => k + ' = :' + k);
    const [q, p] = this.extract_from_where(params.where);

    return {
      query: `UPDATE ${this.entity_name} SET ${update_values.join(', ')} WHERE ${q} RETURNING id`,
      params: { ...params.data, ...p },
    };
  }
}
