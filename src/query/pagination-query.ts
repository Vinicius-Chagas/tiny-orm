import { Class } from 'src/interfaces/repository.interface';
import { PaginationOpts } from 'src/types/Pagination.types';

export class PaginationQueries<C extends Class> {
  private opts: PaginationOpts<C>;
  private query: string;
  private params: { [x: string]: unknown };
  constructor(opts: PaginationOpts<C>) {
    this.opts = opts;
    this.query = ' ';
    this.params = {};
  }

  build() {
    this.orderBy();
    this.limit();
    this.skip();
    return {
      query: this.query,
      params: this.params,
    };
  }
  private limit() {
    if (this.opts.limit) {
      this.query += ` LIMIT :limit `;
      this.params['limit'] = this.opts.limit;
    }
  }

  private skip() {
    if (this.opts.skip) {
      this.query += ' OFFSET :skip ';
      this.params['skip'] = this.opts.skip;
    }
  }

  private orderBy() {
    if (this.opts.orderBy) {
      const order2 = Object.entries(this.opts.orderBy).reduce((acc, [k, v]) => {
        acc.push(`${k} ${v ?? 'ASC'}`);
        return acc;
      }, [] as string[]);

      this.query += ' ORDER BY :order ';
      this.params['order'] = order2.join(' , ');
    }
  }
}
