export async function cleanupExpired(pool) {
 await pool.query('DELETE FROM arcade_login_requests WHERE expires_at<now()');
 await pool.query('DELETE FROM arcade_logins WHERE expires_at<now()');
 await pool.query("DELETE FROM arcade_challenges WHERE created_at<now()-interval '2 days'");
 await pool.query('DELETE FROM arcade_deleted_accounts WHERE expires_at<now()');
}
export function startMaintenance(pool) {
 let busy=false;
 const run=async()=>{if(busy)return;busy=true;try{await cleanupExpired(pool)}catch{console.warn('Rewards cleanup deferred until the database is available')}finally{busy=false}};
 void run();
 const timer=setInterval(run,3600000);timer.unref();return ()=>clearInterval(timer);
}
