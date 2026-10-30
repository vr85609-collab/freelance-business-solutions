import pg from 'pg';import {readFile} from 'node:fs/promises';
if(!process.env.DATABASE_URL)throw Error('Set DATABASE_URL before migrating');
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});
try{await pool.query(await readFile(new URL('../sql/loyalty.sql',import.meta.url),'utf8'));console.log('Loyalty schema applied')}finally{await pool.end()}
