import { Class } from 'src/interfaces/repository.interface';
import { BaseQuery } from './base-query';
import { IQueryOpts } from 'src/interfaces/query-opts.interface';
import { PaginationOpts } from 'src/types/Pagination.types';
import { PaginationQueries } from './pagination-query';
import { omit, pick } from 'lodash';

export class FindQuery<C extends Class> extends BaseQuery<
  C,
  Partial<Pick<IQueryOpts<C>, 'where'> & PaginationOpts<C>>
> {
  constructor(
    public readonly entity_name: string,
    private readonly findType: 'one' | 'id' | 'all',
  ) {
    super(entity_name);
  }

  protected build(params: IQueryOpts<C> & PaginationOpts<C>) {
    const rest = omit(params, ['limit', 'skip', 'orderBy']);
    let result: {
      query: string;
      params: {
        [x: string]: unknown;
      };
    } | null = null;
    switch (this.findType) {
      case 'one':
        result = this.findOne(rest);
        break;
      case 'id':
        result = this.findOneById(rest);
        break;
      case 'all':
        result = this.findAll(rest);
        break;
    }

    const paginator = new PaginationQueries(pick(params, ['limit', 'skip', 'orderBy']));
    const pagination = paginator.build();

    return {
      query: result.query.concat(pagination.query).trim(),
      params: { ...result.params, ...pagination.params },
    };
  }

  private findAll(params: IQueryOpts<C>) {
    const result = this.extract_from_where(params?.where);
    let q = result[0];
    const p = result[1];
    q = q === '' ? '1=1' : q;
    return { query: `SELECT * FROM ${this.entity_name} WHERE ${q}`, params: { ...p } };
  }

  //** Não havia necessidade de customização no query object,
  // pois eu posso apenas fazer a constraint de tipos na classe concreta do Repository.
  // Simplificação é tudo */
  private findOneById(params: IQueryOpts<C>) {
    return this.findOne(params);
  }

  private findOne(params: IQueryOpts<C>) {
    const [q, p] = this.extract_from_where(params?.where);
    return { query: `SELECT * FROM ${this.entity_name} WHERE ${q}`, params: { ...p } };
  }
}
