import { toString } from 'src/utils';
import { BaseQuery } from './base-query';

export class UpdateQuery<C extends { id: unknown }> extends BaseQuery<
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
    const update_values = Object.entries(this.data).map(([k, v]) => k + ' = ' + toString(v));

    return `UPDATE ${this.entity_name} SET${update_values.join(', ')} WHERE id = $1 RETURNING id`;
  }

}
