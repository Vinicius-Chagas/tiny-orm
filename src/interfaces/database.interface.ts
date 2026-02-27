import { QueryResult } from 'pg';

interface IDataBase {
  query(sql: string, params: any[]): Promise<QueryResult<any>>;
}

export { IDataBase };
