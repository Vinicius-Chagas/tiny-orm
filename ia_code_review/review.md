# Code Review - Tiny ORM

Fala! Revisei o código do projeto. Vi que você fez um excelente uso de Generics no TypeScript e teve a preocupação de implementar Prepared Statements para os valores no Postgres, o que já evita as formas mais comuns de injeção de dependência em valores. A estrutura de diretórios também está bem organizada.

No entanto, há pontos críticos que precisam de correção imediata, principalmente na camada de segurança e no design das classes. Abaixo está a análise detalhada.

## 1. PRINCÍPIOS SOLID

### Violação de SRP (Single Responsibility Principle) e OCP (Open/Closed Principle)
**Onde:** `src/query/find-query.ts`
**Problema:** A classe `FindQuery` recebe um `findType` (`'one' | 'id' | 'all'`) no construtor e utiliza um `switch` para determinar como montar a query. Além disso, ela mistura a responsabilidade de buscar dados com a lógica de paginação.
**Impacto:** Sempre que surgir um novo tipo de busca (como `count` ou `exists`), a classe precisará ser modificada (quebrando o OCP). Ela também assume responsabilidades demais ao embutir uma nova classe e concatenar lógica de paginação (quebrando o SRP).
**Como corrigir:** Use o padrão Strategy ou divida a classe em pequenas classes com um objetivo único (`FindOneQuery`, `FindAllQuery`). A paginação deve ser preferencialmente acoplada via composição em um estágio fora do núcleo da query, e não instanciada e fundida diretamente dentro do mesmo builder base.

```typescript
// Exemplo de correção (OCP e SRP aplicados)
export class FindAllQuery<C extends Class> extends BaseQuery<C, IQueryOpts<C>> {
  protected build(params: IQueryOpts<C>) {
    // Monta apenas a lógica do Find All
  }
}
```

### Violação de DIP (Dependency Inversion Principle)
**Onde:** `src/core/repository.ts`
**Problema:** A classe `Repository` instancia diretamente classes concretas como `new InsertQuery(this.entity_name)` ou `new FindQuery(...)` no meio dos seus métodos.
**Impacto:** Você não consegue testar o repositório de forma unitária de fato (fazendo um mock do comportamento das queries) e fica totalmente acoplado à implementação atual da camada de queries.
**Como corrigir:** O repositório deve depender de abstrações. Injete as dependências pelo construtor (como uma Factory de queries) ou crie as queries baseadas em interfaces genéricas ao invés de atrelar a classes concretas fechadas.

## 2. CLEAN CODE

### Nomenclatura inconsistente que não revela intenção
**Onde:** Em todo o projeto, mas especificamente em `BaseQuery` e `Repository`.
**Problema:** Mistura de padrões `camelCase` e `snake_case` no mesmo contexto (ex: `entity_name`, `extract_from_where`, `exec_returning_affected`).
**Impacto:** Quebra a convenção do ecossistema TypeScript/JavaScript, dificultando a leitura por outros desenvolvedores da comunidade e demonstrando falta de aderência a padrões (Clean Code prioriza consistência).
**Como corrigir:** Padronize tudo para `camelCase` para propriedades, variáveis e métodos de classe (`entityName`, `extractFromWhere`, `execReturningAffected`).

### Ausência de DRY (Don't Repeat Yourself) e Comentários Desnecessários
**Onde:** `src/query/find-query.ts` (método `findOneById`)
**Problema:** O método `findOneById` simplesmente repassa os dados chamando o método `findOne` e conta com um comentário gigante acima justificando por que foi feito assim ("Não havia necessidade de customização... Simplificação é tudo").
**Impacto:** Ruído visual. É código e comentário mortos que ocupam espaço sem fornecer utilidade (o oposto de "simplificação").
**Como corrigir:** Se a lógica é exatamente a mesma, não crie dois métodos. Remova o método `findOneById` e o comentário, utilizando apenas o `findOne`.

### Complexidade Ciclomática e Bug Lógico Silencioso no Replace
**Onde:** `src/query/base-query.ts` (método `buildParams`)
**Problema:** O código utiliza iterativamente `built_query.replace(':' + key, '$' + idx)` para injetar o parâmetro numérico (`$1`). O grande problema é que o `.replace` nativo com strings em JavaScript altera apenas a **primeira** ocorrência. Além disso, chaves com prefixos parecidos (ex: `:id` e `:identifier`) podem gerar substituições parciais incorretas e quebrar sua query se substituídas na ordem errada.
**Impacto:** O código tem a premissa de funcionar bem, mas na prática não substituirá variáveis usadas múltiplas vezes na query, resultando em sintaxe SQL inválida.
**Como corrigir:** Construa o SQL já usando os placeholders `$1` durante o build da query (por array/join), ou utilize regex global com delimitador de limites de palavras `\b` (embora menos recomendado que construir o identificador final diretamente).

## 3. SEGURANÇA

### SQL Injection Crítico via Identificadores (Nomes de Colunas/Chaves dinâmicos)
**Onde:** `BaseQuery.extract_from_where`, `InsertQuery` e `UpdateQuery`.
**Princípio violado:** Ausência de Sanitização de Inputs.
**Problema:** Você itera e concatena chaves do objeto de input dinamicamente na string SQL. Por exemplo: `query_entries.push(String(k) + ' = :w' + String(k))` e `INSERT INTO ... (${cols.join(', ')})`. Os *Prepared Statements* do Postgres protegem apenas **valores**, não os identificadores (nomes de colunas ou tabelas).
**Impacto:** Se o endpoint da API repassa direto o payload de `req.body` sem validar e houver uma chave maliciosa (ex: `{"id = 1; DROP TABLE users; --": "valor"}`), ela será concatenada no SQL direto e será executada pelo banco. Isso é injeção de SQL crítica.
**Como corrigir:** Implemente validação obrigatória (Allowlist). Verifique se o nome da chave faz parte das propriedades (colunas) mapeadas e válidas para aquela entidade/tabela antes de anexar na string da query.

```typescript
// Exemplo Conceitual
const validColumns = ['id', 'name', 'email'];
if (!validColumns.includes(key)) {
  throw new Error(`Coluna não autorizada/inválida: ${key}`);
}
```

### Vazamento de Dados Sensíveis (Data Leakage)
**Onde:** `src/core/database.ts` (método `query`)
**Princípio violado:** Dados Sensíveis Expostos em Logs.
**Problema:** Para debug, o comando faz `console.debug('DB QUERY:', sql, params);`.
**Impacto:** Caso você utilize essa ferramenta com uma flag em ambiente de homologação/produção, senhas textuais, tokens JWT ou dados sensíveis de usuários poderão ser guardados nos logs em texto plano, quebrando políticas de segurança (LGPD).
**Como corrigir:** Adicione uma máscara para campos sensíveis (como `password`) e desabilite totalmente a amostragem do payload em parâmetros em ambientes produtivos, logando apenas a string da query de forma agnóstica.

### Paginação e "Order By" Inseguros e Infuncionais
**Onde:** `src/query/pagination-query.ts`
**Problema:** Você atribui o nome da coluna de ordem a um parâmetro (`ORDER BY :order` > `$1`). Mas drivers do Postgres não permitem passar colunas de tabelas para `ORDER BY` como *prepared statement*. Ele interpreta o `$1` como um valor (string literal), a ordenação será completamente ignorada pela engine do BD.
**Impacto:** O retorno não trará ordenação alguma. Se tentar consertar isso passando o valor para interpolação sem validar, voltará para a brecha da injeção de SQL do tipo 1.
**Como corrigir:** A string de ordenação deve ser injetada estaticamente na concatenação, contanto que passe rigidamente por uma **Allowlist** das colunas permitidas e a direção da ordernação permitida (`ASC` ou `DESC`).

---

### Resumo de Fechamento

**Pontos positivos:**
* Você tem boas habilidades com os tipos avançados do Typescript, como os Generics (`<C extends Class>`), algo que confunde muita gente.
* Mostrou preocupação com abstração arquitetural, isolando bem a responsabilidade de acesso primário em uma classe Repository.
* Você teve a preocupação certa de usar *Prepared Statements* desde o início para prevenir Injeção SQL na camada de valores.

**Os 3 conceitos mais urgentes para você estudar no momento:**
1. **Identificadores x Valores no Banco de Dados (Segurança):** Estude como um banco previne Injeção de SQL e entenda que *Prepared Statements* tratam a entrada do usuário estritamente como string literal; por isso, construir nomes de colunas e dinamicamente requer Allowlist obrigatório, pois não pode contar com o driver.
2. **Strategy e Factory Pattern (Solid & Design):** Aprofunde-se nesses padrões criacionais e comportamentais para não engessar toda a arquitetura através da instância forçada (com a keyword `new`) das regras específicas diretamente dentro do repositório base ou usando mega classes que sofrem com switches internos.
3. **Clean Code em JavaScript/TypeScript:** Reveja convenções da comunidade (uso do `camelCase` por default em métodos) e pratique a análise profunda de métodos utilitários, como o `String.prototype.replace()`, já que ele causa falhas silenciosas difíceis de rastrear.
