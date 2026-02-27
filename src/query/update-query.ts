import { toString } from 'src/utils/string-utils';
import { BaseQuery } from './base-query';
import { Class } from 'src/interfaces/repository.interface';

export class UpdateQuery<C extends Class> extends BaseQuery<C> {
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
