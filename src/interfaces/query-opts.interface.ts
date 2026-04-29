import { Class } from './repository.interface';

interface IQueryOpts<C extends Class> {
  where: Partial<C>;
  data: Partial<C>;
}

export { IQueryOpts };
