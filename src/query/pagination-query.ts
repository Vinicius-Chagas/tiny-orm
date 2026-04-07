import { Class } from 'src/interfaces/repository.interface';
import { PaginationOpts } from 'src/types/Pagination.types';

export class PaginationQueries<C extends Class> {
  private opts: PaginationOpts<C>;
  constructor(opts: PaginationOpts<C>) {
    this.opts = opts;
  }

  limit() {
    if (this.opts.limit) {
      return { query: ` LIMIT :limit `, params: { limit: this.opts.limit } };
    }
    return undefined;
  }

  skip() {
    if (this.opts.skip) {
      return { query: ' OFFSET :skip ', params: { skip: this.opts.skip } };
    }
    return undefined;
  }

  orderBy() {
    if (this.opts.orderBy) {
      const order2 = Object.entries(this.opts.orderBy?.key).reduce((acc, [k, v]) => {
        acc.push(`${k} ${v ?? 'ASC'}`);
        return acc;
      }, [] as string[]);

      return {
        query: ' ORDER BY :order ',
        params: { order: order2.join(' , ') },
      };
    }
    return undefined;
  }
}
