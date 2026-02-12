# tiny-orm ✅

A tiny educational TypeScript ORM that shows how to map classes to Postgres tables, execute basic CRUD, and use constructor generics for type-safe repositories.

---

## 🔧 Requirements

- Node 16+ / 18+ (recommended)
- Yarn or npm
- PostgreSQL database

---

## 🚀 Quick setup

1. Install dependencies:

```bash
yarn install
# or
npm install
```

2. Create the database/table used by the examples (example uses a table matching the entity class name, lowercased):

- Use UUID id:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE orm (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  val1 text NOT NULL,
  val2 integer NOT NULL
);
```

- Or use serial id:
```sql
CREATE TABLE orm (
  id serial PRIMARY KEY,
  val1 text NOT NULL,
  val2 integer NOT NULL
);
```

Run with psql (example):

```bash
psql -U postgres -d estudo -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
psql -U postgres -d estudo -c "CREATE TABLE orm (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), val1 text NOT NULL, val2 integer NOT NULL);"
```

> ⚠️ If you get an error like `relation "nodetype" does not exist` or `relation "orm" does not exist`, create the table that corresponds to your entity class name (class name lowercased by default).

---

## ▶️ Run the example/test script

- Run directly with ts-node (recommended for quick testing):

```bash
npx ts-node -r tsconfig-paths/register src/tests/test_v_1.ts
```

- Or add an npm script to `package.json`:

```json
"scripts": {
  "test:v1": "ts-node -r tsconfig-paths/register src/tests/test_v_1.ts"
}
```

Then run:

```bash
yarn test:v1
# or
npm run test:v1
```

---

## 📚 Usage (short)

- Define an entity class (example in `src/tests/orm.ts`):

```ts
export class Orm {
  id?: string;
  val1: string;
  val2: number;
}
```

- Create repository and use it:

```ts
const repo = new Repository(db, Orm);
await repo.insert({ val1: 'a', val2: 1 });
await repo.updateById(id, { val1: 'x' });
await repo.deleteById(id);
const all = await repo.findAll();
```

Notes:
- The repository uses the class constructor name lowercased as the table name by default: `Orm` -> `orm`.
- The repository is generic: `Repository<C extends new (...args:any[]) => any>` and uses `InstanceType<C>` for input/return types.

---

## 🔒 Security & robustness tips

- The current implementation builds SQL strings — prefer parameterized queries (placeholders + values) to avoid SQL injection and avoid syntax errors when values contain quotes or special characters.
- Consider using transactions for multi-step operations.

---

## 🧪 Tests / Examples

See `src/tests/test_v_1.ts` for a simple end-to-end example that:
- inserts a row
- reads it back
- updates it
- lists all rows
- deletes the row

---

## ✨ Contributing

This is an educational project — contributions, improvements and bug reports are welcome.

---

## Author
Vinícius — learning and experimenting with TypeScript + Postgres

---

License: MIT
