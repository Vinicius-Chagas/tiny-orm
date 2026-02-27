## 1. Folder & File Naming Conventions

Your current structure:

```
src/
  utils.ts
  drive/
    DataBase.ts
    Repository.ts
    abstract/
      BaseQuery.ts
    queries/
      deleteQuery.ts
      findQuery.ts
      InsertQuery.ts    ← inconsistent casing!
      updateQuery.ts
  tests/
    orm.ts
    test_v_1.ts
```

### Problems I see:

- **Inconsistent file casing**: InsertQuery.ts is PascalCase while deleteQuery.ts, findQuery.ts, updateQuery.ts are camelCase. Pick **one** convention and stick with it. In the TypeScript/Node ecosystem, the two most common are:
  - `kebab-case` (e.g., `insert-query.ts`) — most popular in modern TS projects
  - `PascalCase` matching the class name (e.g., InsertQuery.ts) — common in Angular-style projects

- **`drive/` folder** — I think you meant **`driver/`** or perhaps **`core/`**? The word "drive" in English usually refers to a disk drive, not a database driver. This is a small thing but naming matters a lot for readability.

- **`tests/` inside src** — it's more conventional to keep tests at the project root or in a separate top-level folder. Many projects use:
  - `__tests__/` at root level
  - `tests/` at root level
  - Or colocated test files like `InsertQuery.spec.ts` next to InsertQuery.ts

### Suggested structure:

```
src/
  core/
    database.ts              (or DataBase.ts if you prefer PascalCase)
    repository.ts
  query/
    base-query.ts
    insert-query.ts
    find-query.ts
    update-query.ts
    delete-query.ts
  entity/
    decorators.ts            (future: @Column, @Table, etc.)
  interfaces/
    query.interface.ts
    repository.interface.ts
    database.interface.ts
  utils/
    string-utils.ts
tests/
  fixtures/
    orm.entity.ts
  integration/
    repository.test.ts
```

Key ideas:
- **Group by responsibility**, not by whether something is abstract or concrete
- The `abstract/` folder is unnecessary — an abstract class is just an implementation detail. `BaseQuery` belongs with the other query files
- An `interfaces/` folder (or colocating interfaces near their users) helps separate **contracts** from **implementations**

---

## 2. Interfaces — Defining Contracts

Right now, your code has **no interfaces**. Everything depends directly on concrete classes. This makes it hard to swap implementations or test in isolation.

### The principle: *"Depend on abstractions, not concretions"*

Think of an interface as a **contract** or a **promise**. It says *"anything that implements me will have these methods"* without saying *how* they work.

**Small example of the concept:**

```ts
// This is a contract — it says WHAT a database connection must do
interface IDatabase {
  query(sql: string, params?: unknown[]): Promise<QueryResult>;
}

// This is a contract — it says WHAT a repository must do
interface IRepository<T> {
  insert(data: T): Promise<{ id: unknown }>;
  findAll(): Promise<T[]>;
  findOneById(id: string): Promise<T | null>;
  updateById(id: string, data: Partial<T>): Promise<{ affected: string[] }>;
  deleteById(id: string): Promise<{ affected: string[] }>;
}
```

Then your concrete classes **implement** these interfaces. The huge benefit is: if tomorrow you want to support MySQL instead of Postgres, you write a new class that implements `IDatabase` and everything else keeps working.

---

## 3. Abstract Classes vs Interfaces — When to Use Each

You already have `BaseQuery` as an abstract class, which is good! But it's helpful to understand the distinction:

| | Interface | Abstract Class |
|---|---|---|
| **Contains logic?** | No, only signatures | Yes, can have shared code |
| **Multiple inheritance?** | A class can implement many interfaces | A class can extend only ONE abstract class |
| **Use when...** | Defining a contract/shape | Sharing common behavior among related classes |

**A good pattern**: Define an **interface** for the public contract, then use an **abstract class** to provide shared implementation details:

```
IQuery (interface)         → "what can a query do?"
  ↑ implements
BaseQuery (abstract class) → "shared logic for all queries"
  ↑ extends
InsertQuery (concrete)     → "specific INSERT behavior"
```

This way, external code (like Repository) depends on `IQuery`, not on `BaseQuery` directly.

---

## 4. Bugs & Design Issues I Spotted

### 4.1 — `DeleteQuery.build()` uses `SELECT` instead of `DELETE`

Look at your `build()` method — it says `SELECT * FROM` instead of `DELETE FROM`. This means calling `deleteById` would **read** data but never **delete** anything! 🐛

### 4.2 — `UpdateQuery.build()` receives `$1` placeholder but never passes the `id` parameter

The SQL says `WHERE id = $1` which is correct for parameterized queries, but the `id` value is never passed to the `execute` method. The `id` parameter from `Repository.updateById` is received but **never forwarded** to the query.

### 4.3 — `toString()` logic is inverted

```ts
export function toString(val: unknown) {
  if (typeof val !== 'string') return val as string;  // not a string → return as-is
  return `'${String(val)}'`;                           // is a string → wrap in quotes
}
```

This returns non-strings **as-is** (without conversion) and wraps strings in quotes. The function name is misleading, and more importantly, **building SQL by concatenating values is a SQL injection vulnerability**. This is the #1 thing to fix for robustness.

### 4.4 — `Repository.extract_affected_ids` is defined but never used

The method at line 51 of Repository.ts is dead code — you already have the same logic in `BaseQuery.extract_affected_ids`. Remove duplication!

---

## 5. Parameterized Queries — Security First 🔒

This is critical. Right now, your queries build SQL like:

```sql
INSERT INTO orm (val1, val2) VALUES ('teste', 1)
```

If `val1` were `"'; DROP TABLE orm; --"`, that SQL becomes destructive. The `pg` library already supports **parameterized queries** with `$1, $2, ...` placeholders. The idea:

- `build()` should return both the SQL **template** and an **array of values**
- The database driver handles escaping safely

This is a perfect reason to define an interface for what `build()` returns — something like a `{ sql: string, params: unknown[] }` shape. Then all query classes follow that contract.

---

## 6. Design Pattern Suggestions for Scalability

### 6.1 — **Builder Pattern** for complex queries

As your ORM grows, you'll want chainable queries like:

```ts
repo.find().where({ val1: 'x' }).orderBy('val2').limit(10).execute()
```

The **Builder Pattern** lets you construct complex objects step by step. Each method returns `this`, enabling chaining. This is exactly how TypeORM's `QueryBuilder` works.

### 6.2 — **Strategy Pattern** for database dialects

If you ever want to support MySQL or SQLite, define an interface for a "dialect" that knows how to generate SQL for each database engine. Each query class receives the dialect as a dependency.

### 6.3 — **Generic Constraints** (you're already doing this partially!)

Your use of `C extends Class` in `Repository` is on the right track. Once you refine your interfaces, the generics will flow more naturally and give you better type safety — for example, `findAll()` should return `InstanceType<C>[]` instead of the raw `pg` result.

---

## 7. Summary of Action Items (Priority Order)

1. **Fix the bugs** — `DeleteQuery` using SELECT, unused `id` parameter in update, inverted `toString`, dead code in Repository
2. **Create interfaces** — `IDatabase`, `IRepository<T>`, `IQueryResult` (or similar)
3. **Make `build()` return SQL + params** — eliminate string concatenation for values
4. **Standardize file naming** — pick kebab-case or PascalCase and apply everywhere
5. **Rename `drive/`** to something clearer like `core/` or `driver/`
6. **Move tests** out of src or adopt a co-location pattern
7. **Remove `abstract/` folder** — place `BaseQuery` alongside the other query files
8. **Consider a Builder Pattern** for future query composition

---

## 📚 Further Reading

- **SOLID Principles in TypeScript** — especially the "D" (Dependency Inversion: depend on interfaces, not concrete classes)
- **TypeORM source code** on GitHub — look at their `QueryBuilder`, `EntityManager`, and `Connection` interfaces for inspiration
- **Clean Architecture by Robert C. Martin** — the concepts of separating interfaces from implementations come from here

You're making excellent progress! The fact that you're building queries as separate classes and using generics already shows solid OOP thinking. The next big leap is **extracting interfaces** and **fixing the SQL injection vector** — those two changes alone will make the architecture much more professional. 💪