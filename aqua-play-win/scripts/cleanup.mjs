import pg from 'pg';
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});
try {
 await pool.query('DELETE FROM arcade_login_requests WHERE expires_at<now()');
 await pool.query('DELETE FROM arcade_logins WHERE expires_at<now()');
 await pool.query("DELETE FROM arcade_challenges WHERE created_at<now()-interval '2 days'");
 await pool.query('DELETE FROM arcade_deleted_accounts WHERE expires_at<now()');
 console.log('Expired reward-session records removed');
}finally{await pool.end()}
