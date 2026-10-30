import pg from 'pg';import {readFile} from 'node:fs/promises';
if(!process.env.DATABASE_URL)throw Error('Set DATABASE_URL before migrating');
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:10000});
try {
 const client=await pool.connect();
 try {
  await client.query('BEGIN');
  await client.query('SELECT pg_advisory_xact_lock(20261031)');
  await client.query(await readFile(new URL('../sql/loyalty.sql',import.meta.url),'utf8'));
  await client.query('COMMIT');console.log('Loyalty schema applied');
 }catch{await client.query('ROLLBACK');throw Error('Rewards schema initialization failed; no partial migration was committed')}
 finally{client.release()}
}catch{throw Error('Rewards database initialization failed. Check the private database connection and migration logs')}
finally{await pool.end()}
