import { BaseQuery } from '../abstract/BaseQuery';

export class FindQuery<C extends { id: unknown }> extends BaseQuery<C, { id?: C['id'] }> {
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
    return `SELECT * FROM ${this.entity_name}`;
  }

  //** Não havia necessidade de customização no query object,
  // pois eu posso apenas fazer a constraint de tipos na classe concreta do Repository.
  // Simplificação é tudo */
  private findOneById() {
    return this.findOne();
  }

  private findOne() {
    const where = this.extract_from_where();
    return `SELECT * FROM ${this.entity_name} WHERE ${where}`;
  }

  private extract_from_where() {
    if (!this.where) return '';
    const entries = Object.entries(this.where.where);
    return entries.map(([k, v]) => `${String(k)} = ${String(v)}`).join(' AND ');
  }
}
