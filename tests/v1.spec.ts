import { Repository } from 'src/core/repository';
import { DataBase } from 'src/core/database';
import { Orm } from './orm';
import { PoolConfig } from 'pg';

// database connection configuration. tests expect a PostgreSQL
// instance reachable with these defaults; override with standard
// PG environment variables if necessary.
const dbConfig: PoolConfig = {
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'password',
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT) || 5432,
  database: process.env.PGDATABASE || 'estudo',
};

describe('Repository (integration)', () => {
  let db: DataBase;
  let repo: Repository<typeof Orm>;

  beforeAll(async () => {
    db = new DataBase(dbConfig);
    repo = new Repository(db, Orm);

    // Mantém o DB no search+path correto
    await db.query('SET search_path TO tiny_orm');

    // Cria tabela se não existe
    await db.query(
      `CREATE TABLE IF NOT EXISTS orm (
         id serial PRIMARY KEY,
         val1 text NOT NULL,
         val2 integer NOT NULL
       );`,
    );
  });

  beforeEach(async () => {
    await db.query('TRUNCATE TABLE orm RESTART IDENTITY CASCADE');
  });

  it('validates constructor argument', () => {
    expect(() => new Repository(db, {} as any)).toThrow(TypeError);
  });

  describe('insert', () => {
    it('persists a row and returns the new id', async () => {
      const result = await repo.insert({ val1: 'teste', val2: 1 });
      expect(result.id).toBeDefined();
      const row = await repo.findOneById(result.id!);
      expect(row).toMatchObject({ val1: 'teste', val2: 1 });
    });
  });

  describe('findOneById', () => {
    it('retrieves a previously inserted row', async () => {
      const { id } = await repo.insert({ val1: 'x', val2: 2 });
      const row = await repo.findOneById(id!);
      expect(row).toMatchObject({ id, val1: 'x', val2: 2 });
    });
  });

  describe('findOne', () => {
    it('returns the first row matching a where clause', async () => {
      await repo.insert({ val1: 'y', val2: 3 });
      const row = await repo.findOne({ where: { val1: 'y' } });
      expect(row).toMatchObject({ val1: 'y', val2: 3 });
    });
  });

  describe('findAll', () => {
    it('returns every row in the table', async () => {
      await repo.insert({ val1: 'a', val2: 1 });
      await repo.insert({ val1: 'b', val2: 2 });
      const rows = await repo.findAll();
      expect(rows).toHaveLength(2);
    });
  });

  describe('updateById', () => {
    it('modifies a row and reports affected id', async () => {
      const { id } = await repo.insert({ val1: 'foo', val2: 5 });
      const res = await repo.updateById(id!, { val1: 'z' });
      expect(res).toEqual({ affected: [id!] });
      const updated = await repo.findOneById(id!);
      expect(updated?.val1).toBe('z');
    });
  });

  describe('deleteById', () => {
    it('removes a row and reports affected id', async () => {
      const { id } = await repo.insert({ val1: 'bar', val2: 7 });
      const res = await repo.deleteById(id!);
      expect(res).toEqual({ affected: [id!] });
      const missing = await repo.findOneById(id!);
      expect(missing).toBeUndefined();
    });
  });

  afterAll(async () => {
    // close pool so Jest can exit cleanly
    await db.close();
  });
});
