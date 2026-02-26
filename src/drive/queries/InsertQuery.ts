import { toString } from 'src/utils';
import { BaseQuery } from '../abstract/BaseQuery';

export class InsertQuery<C extends { id: unknown }> extends BaseQuery<
  C,
  { id: C['id'] | undefined }
> {
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

    return `INSERT INTO ${this.entity_name} (${cols.join(
      ', ',
    )}) VALUES (${vals.join(', ')}) RETURNING id`;
  }
}
