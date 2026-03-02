import { Class } from 'src/interfaces/repository.interface';
import { BaseQuery } from './base-query';

export class FindQuery<C extends Class> extends BaseQuery<C> {
  constructor(
    public readonly entity_name: string,
    private readonly findType: 'one' | 'id' | 'all',
    private readonly where?: { where: Partial<C> },
  ) {
    super(entity_name);
  }

  protected build() {
    switch (this.findType) {
      case 'one':
        return this.findOne();
      case 'id':
        return this.findOneById();
      case 'all':
        return this.findAll();
    }
  }

  private findAll() {
    return { query: `SELECT * FROM $1`, params: [this.entity_name] };
  }

  //** Não havia necessidade de customização no query object,
  // pois eu posso apenas fazer a constraint de tipos na classe concreta do Repository.
  // Simplificação é tudo */
  private findOneById() {
    return this.findOne();
  }

  private findOne() {
    const where = this.extract_from_where();
    return { query: `SELECT * FROM $1 WHERE $2`, params: [this.entity_name, where] };
  }

  private extract_from_where() {
    if (!this.where) return '';
    const entries = Object.entries(this.where.where);
    return entries.map(([k, v]) => `${String(k)} = ${String(v)}`).join(' AND ');
  }
}
