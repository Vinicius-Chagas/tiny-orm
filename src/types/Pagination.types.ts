import { Class } from 'src/interfaces/repository.interface';

export type PaginationOpts<C extends Class> = {
  limit?: number;
  skip?: number;
  orderBy?: Partial<Record<keyof InstanceType<C>, 'DESC' | 'ASC'>>;
};
