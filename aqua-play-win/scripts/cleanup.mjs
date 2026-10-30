import pg from 'pg';
import {cleanupExpired} from '../rewards/maintenance.js';
if(!process.env.DATABASE_URL)throw Error('Set DATABASE_URL before cleanup');
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:10000});
try {
 await cleanupExpired(pool);
 console.log('Expired reward-session records removed');
}catch{throw Error('Rewards cleanup failed. Check the private database connection')}
finally{await pool.end()}
