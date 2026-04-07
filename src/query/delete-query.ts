import { Class } from 'src/interfaces/repository.interface';
import { BaseQuery } from './base-query';
import { IQueryOpts } from 'src/interfaces/query-opts.interface';

export class DeleteQuery<C extends Class> extends BaseQuery<C, Pick<IQueryOpts<C>, 'where'>> {
  constructor(public readonly entity_name: string) {
    super(entity_name);
  }

  protected build(params: Pick<IQueryOpts<C>, 'where'>) {
    const [q, p] = this.extract_from_where(params.where);
    return {
      query: `DELETE FROM ${this.entity_name} WHERE ${q} RETURNING id`,
      params: { ...p },
    };
  }
}
