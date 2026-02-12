import { DataBase } from 'src/drive/DataBase';
import { Repository } from 'src/drive/Repository';
import { Orm } from './orm';

const db = new DataBase({
  user: 'postgres',
  password: '',
  max: 5,
  query_timeout: 30000,
  database: 'estudo',
});

async function test() {
  const orm_repo = new Repository(db, Orm);

  const result_q1 = await orm_repo.insert({
    val1: 'teste',
    val2: 1,
  });

  console.log({ result_q1: result_q1 });

  if (!result_q1?.id) {
    throw Error('No insert result');
  }

  const result_q2 = await orm_repo.findOneById(result_q1.id);

  console.log({ result_q2: result_q2 });

  await orm_repo.updateById(result_q1.id, {
    val1: 'teste update',
    val2: 11,
  });

  const result_q4 = await orm_repo.findAll();

  console.log({ result_q4: result_q4 });

  const result_q5 = await orm_repo.deleteById(result_q1.id);

  console.log({ result_q5: result_q5.affected });
}

test();
