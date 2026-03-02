import { Class } from 'src/interfaces/repository.interface';
import { PaginationOpts } from 'src/types/Pagination.types';

export class PaginationQueries<C extends Class> {
  private opts: PaginationOpts<C>;
  constructor(opts: PaginationOpts<C>) {
    this.opts = opts;
  }

  limit() {
    if (this.opts.limit) {
      return { query: ` LIMIT $ `, params: [this.opts.limit] };
    }
  }

  skip() {
    if (this.opts.skip) {
      return { query: ' OFFSET $ ', params: [this.opts.skip] };
    }
  }

  orderBy() {
    if (this.opts.orderBy) {
      const order2 = Object.entries(this.opts.orderBy?.key).reduce((acc, [k, v]) => {
        if (v) {
          acc.push(k);
        }
        return acc;
      }, [] as string[]);

      return {
        query: ' ORDER BY $ $ ',
        params: [order2.join(' , '), this.opts.orderBy?.direction ?? 'ASC'],
      };
    }
  }
}
