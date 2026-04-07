import { Class } from 'src/interfaces/repository.interface';

export type PaginationOpts<C extends Class> = {
  limit?: number;
  skip?: number;
  orderBy?: { key: Record<keyof InstanceType<C>, 'DESC' | 'ASC'> };
};
