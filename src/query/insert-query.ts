import { IQueryOpts } from 'src/interfaces/query-opts.interface';
import { BaseQuery } from './base-query';
import { Class } from 'src/interfaces/repository.interface';

export class InsertQuery<C extends Class> extends BaseQuery<C, Pick<IQueryOpts<C>, 'data'>> {
  constructor(public readonly entity_name: string) {
    super(entity_name);
  }

  protected build(params: Pick<IQueryOpts<C>, 'data'>) {
    const cols: string[] = [];
    const vals: unknown[] = [];

    for (const [k, v] of Object.entries(params.data)) {
      cols.push(k);
      vals.push(v);
    }

    return {
      query: `INSERT INTO ${this.entity_name} (${cols.join(', ')}) VALUES (${cols.map((c) => `:${c}`)}) RETURNING id`,
      params: { ...params.data },
    };
  }
}
