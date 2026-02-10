import { DataBase } from 'src/drive/DataBase';

const db = new DataBase({
  user: 'postgres',
  password: '',
  max: 5,
  query_timeout: 30000,
  database: 'estudo',
});

async function test() {
  const result_q1 = await db.insert('orm', {
    val1: 'teste',
    val2: 1,
  });

  console.log({ result_q1: result_q1 });

  const result_q2 = await db.findById('orm', result_q1[0].id);

  console.log({ result_q2: result_q2[0] });

  await db.updateById('orm', result_q1[0].id, {
    val1: 'teste update',
    val2: 11,
  });

  const result_q4 = await db.findById('orm', result_q1[0].id);

  console.log({ result_q4: result_q4[0] });

  const result_q5 = await db.deleteById('orm', result_q1[0].id);

  console.log({ result_q5: result_q5[0] });
}

test();
