import { Class } from 'src/interfaces/repository.interface';
import { BaseQuery } from './base-query';
import { IQueryOpts } from 'src/interfaces/query-opts.interface';
import { PaginationOpts } from 'src/types/Pagination.types';

export class FindQuery<C extends Class> extends BaseQuery<
  C,
  Pick<IQueryOpts<C>, 'where'> & PaginationOpts<C>
> {
  constructor(
    public readonly entity_name: string,
    private readonly findType: 'one' | 'id' | 'all',
  ) {
    super(entity_name);
  }

  protected build(params: IQueryOpts<C>) {
    switch (this.findType) {
      case 'one':
        return this.findOne(params);
      case 'id':
        return this.findOneById(params);
      case 'all':
        return this.findAll(params);
    }
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
