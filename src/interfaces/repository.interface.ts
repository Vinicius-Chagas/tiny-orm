type Class<T extends { id?: unknown } = any> = new (...args: any[]) => T;

type AffectedReturn<C extends Class> = Promise<{
  affected: NonNullable<InstanceType<C>['id']>[] | undefined;
}>;

interface IRepository<C extends Class = Class> {
  insert(data: InstanceType<C>): Promise<{ id: InstanceType<C>['id'] | undefined }>;

  updateById(id: InstanceType<C>['id'], data: Partial<InstanceType<C>>): AffectedReturn<C>;

  deleteById(id: InstanceType<C>['id']): AffectedReturn<C>;

  findOneById(id: InstanceType<C>['id']): Promise<C | null>;
  findAll(): Promise<Array<C>>;
}

export { IRepository, Class };
