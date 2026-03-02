import { toString } from 'src/utils/string-utils';
import { BaseQuery } from './base-query';
import { Class } from 'src/interfaces/repository.interface';

export class InsertQuery<C extends Class> extends BaseQuery<C> {
  constructor(
    public readonly entity_name: string,
    private readonly data: Partial<C>,
  ) {
    super(entity_name);
  }

  protected build() {
    const cols: string[] = [];
    const vals: string[] = [];

    for (const [k, v] of Object.entries(this.data)) {
      cols.push(k);
      vals.push(toString(v));
    }

    return {
      query: `INSERT INTO $1 ($2) VALUES ($3) RETURNING id`,
      params: [this.entity_name, cols.join(', '), vals.join(', ')],
    };
  }
}
