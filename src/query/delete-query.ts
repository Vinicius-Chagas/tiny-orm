import { Class } from 'src/interfaces/repository.interface';
import { BaseQuery } from './base-query';

export class DeleteQuery<C extends Class> extends BaseQuery<C> {
  constructor(
    public readonly entity_name: string,
    private readonly where?: { where: Partial<C> },
  ) {
    super(entity_name);
  }

  protected build() {
    const where = this.extract_from_where();
    return { query: `DELETE FROM $1 WHERE $2`, params: [this.entity_name, where] };
  }

  private extract_from_where() {
    if (!this.where) return '';
    const entries = Object.entries(this.where.where);
    return entries.map(([k, v]) => `${String(k)} = ${String(v)}`).join(' AND ');
  }
}
