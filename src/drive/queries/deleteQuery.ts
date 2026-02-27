import { BaseQuery } from '../abstract/BaseQuery';

export class DeleteQuery<C extends { id: unknown }> extends BaseQuery<C, { id?: C['id'] }> {
  constructor(
    public readonly entity_name: string,
    private readonly where?: { where: Partial<C> },
  ) {
    super(entity_name);
  }

  protected build() {
    const where = this.extract_from_where()
    return `SELECT * FROM ${this.entity_name} WHERE ${where}`;
  }

  private extract_from_where() {
    if (!this.where) return '';
    const entries = Object.entries(this.where.where);
    return entries.map(([k, v]) => `${String(k)} = ${String(v)}`).join(' AND ');
  }


}
