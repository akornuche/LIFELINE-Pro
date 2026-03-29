import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function test() {
  const db = await open({
    filename: ':memory:',
    driver: sqlite3.Database,
  });

  await db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');
  await db.exec('INSERT INTO test (name) VALUES ("A")');

  const query = (text, params = []) => {
    const sqliteQuery = text.replace(/\$1/g, '?').replace(/\$2/g, '?');
    const upperQuery = sqliteQuery.trim().toUpperCase();
    if (upperQuery.startsWith('SELECT') || upperQuery.includes('RETURNING')) {
      return db.all(sqliteQuery, params).then(rows => ({ rows, rowCount: rows.length }));
    } else {
      return db.run(sqliteQuery, params).then(result => ({ rows: [], rowCount: result.changes, lastID: result.lastID }));
    }
  };

  const res = await query('UPDATE test SET name = $1 WHERE id = $2 RETURNING *', ['B', 1]);
  console.log('RESULT:', JSON.stringify(res, null, 2));

  if (res.rows.length > 0 && res.rows[0].name === 'B') {
    console.log('FIX VERIFIED');
  } else {
    console.log('FIX FAILED');
  }
}

test().catch(console.error);
