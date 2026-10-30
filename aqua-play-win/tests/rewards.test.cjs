const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {setup}=require('./helpers.cjs');
const importCore=()=>Promise.all([import('../rewards/service.js'),import('../rewards/policy.js'),import('../rewards/replay.js')]);
function signed(params,secret){const p=new URLSearchParams(params);p.set('signature',crypto.createHmac('sha256',secret).update([...p].map(([k,v])=>k+'='+v).sort().join('')).digest('hex'));return p}
const env={ARCADE_REWARDS_ENABLED:'true',ARCADE_PROMOTION_TERMS_APPROVED:'true',SHOPIFY_ADMIN_ACCESS_TOKEN:'test-not-real',SHOPIFY_API_SECRET:'test-secret',SHOPIFY_SHOP:'test.myshopify.com',ARCADE_FRAUD_SALT:'x'.repeat(32),MAX_COUPONS_PER_WEEK:'20'};
const gid='gid://shopify/Customer/100';
async function poolForTests(){
 if(process.env.REWARDS_TEST_DATABASE_URL){if(!new URL(process.env.REWARDS_TEST_DATABASE_URL).pathname.endsWith('_test'))throw Error('Use a dedicated PostgreSQL database ending in _test');const {default:pg}=await import('pg');return new pg.Pool({connectionString:process.env.REWARDS_TEST_DATABASE_URL})}
 const {PGlite}=await import('@electric-sql/pglite');const db=new PGlite();let tail=Promise.resolve();
 const acquire=async()=>{const previous=tail;let unlock;tail=new Promise(r=>unlock=r);await previous;return unlock};
 const query=(q,p)=>db.query(q==='SELECT pg_advisory_xact_lock(20261030)'?'SELECT 1':q,p);
 return {query:async(q,p)=>{const unlock=await acquire();try{return await query(q,p)}finally{unlock()}},connect:async()=>{const release=await acquire();return {query,release}},end:()=>db.close(),schema:q=>db.exec(q)};
}
function count(r){return r.rowCount??(r.rows.length||r.affectedRows||0)}
// PGlite uses affectedRows for UPDATE/DELETE; production pg uses rowCount.
async function normalizedPool(){const raw=await poolForTests();const norm=r=>({...r,rowCount:count(r)});return {query:async(...a)=>norm(await raw.query(...a)),connect:async()=>{const c=await raw.connect();return {query:async(...a)=>norm(await c.query(...a)),release:()=>c.release()}},end:()=>raw.end(),schema:async q=>raw.schema?raw.schema(q):raw.query(q)}}

test('signed Shopify identity rejects tampering, wrong shop, expiry and duplicates',async()=>{
 const [{verifyProxy}]=await importCore();const now=Date.now(),p=signed({shop:env.SHOPIFY_SHOP,timestamp:String(Math.floor(now/1000)),logged_in_customer_id:'100',path_prefix:'/apps/aqua-arcade',state:'abc'},env.SHOPIFY_API_SECRET);
 assert.equal(verifyProxy(p,env,now),gid);const tampered=new URLSearchParams(p);tampered.set('logged_in_customer_id','101');assert.throws(()=>verifyProxy(tampered,env,now));assert.throws(()=>verifyProxy(p,{...env,SHOPIFY_SHOP:'wrong.myshopify.com'},now));assert.throws(()=>verifyProxy(p,env,now+400000));const duplicate=new URLSearchParams(p);duplicate.append('shop',env.SHOPIFY_SHOP);assert.throws(()=>verifyProxy(duplicate,env,now));
});
test('timezone, Monday-week and qualification use verified values',async()=>{
 const [,p]=await importCore();assert.equal(p.dayKey(new Date('2026-11-02T05:30:00Z')),'2026-11-01');assert.equal(p.weekKey('2026-11-01'),'2026-10-26');assert.equal(p.priorDay('2026-11-02'),'2026-11-01');assert(!p.eligibility({balance:1000,wins:9,days:3},p.POLICY.rewards[0]));
});
test('actual shared game replay accepts a Number Sprint win and rejects forged endings',async()=>{
 const [,,{verifyReplay}]=await importCore();const h=setup();h.open('focus');const events=[];
 for(let v=1;v<=16;v++){const buttons=h.buttons(),b=buttons.find(b=>b.textContent===String(v));events.push({t:20000+v*100,kind:'click',area:'board',index:buttons.indexOf(b)});h.click(b)}
 const good=await verifyReplay({game:'focus',seed:1234567,language:'en',events});assert(good.won,good.error);
 assert(!(await verifyReplay({game:'focus',seed:1234567,language:'en',events:events.slice(0,15)})).won);
 assert(!(await verifyReplay({game:'focus',seed:1234567,language:'en',events:[{t:1,kind:'click',area:'script',index:0}]})).won);
 assert(!(await verifyReplay({game:'bubbles',seed:1234567,language:'en',events:[]})).won);
});
test('coupon input restricts customer, one total use, minimum and no stacking; gift is capped to one-unit value',async()=>{
 const [{discountInput}]=await importCore();const when=new Date('2026-10-30T12:00:00Z');
 const d=discountInput({reward_id:'coupon10',customer_gid:gid,code:'AQUA-TEST'},when);
 assert.deepEqual(d.context,{customers:{add:[gid]}});assert.equal(d.usageLimit,1);assert.equal(d.minimumRequirement.subtotal.greaterThanOrEqualToSubtotal,'25.00');assert.equal(d.customerGets.value.percentage,.1);assert.equal(d.endsAt,'2026-11-02T12:00:00.000Z');assert(Object.values(d.combinesWith).every(v=>v===false));
 const g=discountInput({reward_id:'bathbomb',customer_gid:gid,code:'AQUA-GIFT',variant_gid:'gid://shopify/ProductVariant/1',amount:'5.99'},when);assert.equal(g.customerGets.value.discountAmount.appliesOnEachItem,false);assert.equal(g.customerGets.value.discountAmount.amount,'5.99');assert.deepEqual(g.customerGets.items.products.productVariantsToAdd,['gid://shopify/ProductVariant/1']);
});

test('durable rewards transactions, gift approval, retry and deletion',async t=>{
 const [{RewardsService}]=await importCore(),pool=await normalizedPool();
 await pool.schema(fs.readFileSync(__dirname+'/../sql/loyalty.sql','utf8'));
 let issued=0,fail=false;const seen=[];const shopify={gift:async variant=>{if(variant!=='gid://shopify/ProductVariant/1')throw Error('Not approved');return {variant,amount:'5.99'}},issue:async claim=>{seen.push(claim.code);issued++;if(fail){fail=false;throw Error('Simulated network timeout')}return 'gid://shopify/DiscountCodeNode/1'}};
 const service=new RewardsService(pool,env,{verify:async()=>({won:true}),shopify});
 const reset=async()=>{await pool.query('TRUNCATE arcade_accounts CASCADE');await pool.query('TRUNCATE arcade_login_requests,arcade_deleted_accounts');await pool.query('INSERT INTO arcade_accounts(customer_gid) VALUES($1)',[gid]);issued=0;seen.length=0};
 try{
 await t.test('one-time login exchange binds cookie state and blocks replays',async()=>{await reset();const state=await service.beginLogin();const p=signed({shop:env.SHOPIFY_SHOP,timestamp:String(Math.floor(Date.now()/1000)),logged_in_customer_id:'100',state},env.SHOPIFY_API_SECRET);const code=await service.proxyLogin(p);await assert.rejects(service.exchange(code,'wrong'));const raw=await service.exchange(code,state);assert.equal(await service.identity(raw),gid);await assert.rejects(service.exchange(code,state));assert.equal(await service.identity('forged'),null);await service.logout(raw);assert.equal(await service.identity(raw),null)});
 await t.test('concurrent game submissions credit once; per-game and daily caps apply',async()=>{await reset();const start=await service.start(gid,'focus','en');await pool.query("UPDATE arcade_challenges SET created_at=now()-interval '1 minute' WHERE id=$1",[start.id]);const results=await Promise.all([service.finish(gid,start.id,[]),service.finish(gid,start.id,[])]);assert.equal(results.filter(r=>r.credited).length,1);let a=await service.profile(gid);assert.equal(a.balance,25);assert.equal(a.wins,1);assert.equal(a.days,1);
  for(const game of ['focus','sudoku','maze','queens']){const s=await service.start(gid,game,'en');await pool.query("UPDATE arcade_challenges SET created_at=now()-interval '1 minute' WHERE id=$1",[s.id]);await service.finish(gid,s.id,[])}a=await service.profile(gid);assert.equal(a.wins,3);assert.equal(a.balance,65);
 });
 await t.test('old local totals, impossible timing and other customer sessions cannot create credit',async()=>{await reset();const s=await service.start(gid,'focus','en');await assert.rejects(service.finish(gid,s.id,[]));await assert.rejects(service.finish('gid://shopify/Customer/200',s.id,[]));assert.equal((await service.profile(gid)).balance,0)});
 await t.test('streak bonus is awarded once and survives timezone/DST day arithmetic',async()=>{await reset();const {dayKey,priorDay}=await import('../rewards/policy.js');await pool.query('UPDATE arcade_accounts SET streak=6,last_day=$1 WHERE customer_gid=$2',[priorDay(dayKey()),gid]);const s=await service.start(gid,'focus','en');await pool.query("UPDATE arcade_challenges SET created_at=now()-interval '1 minute' WHERE id=$1",[s.id]);await service.finish(gid,s.id,[]);const p=await service.profile(gid);assert.equal(p.balance,50);assert.equal(p.streak,7)});
 await t.test('not enough points or no live configuration cannot issue coupons',async()=>{await reset();await assert.rejects(service.reserve(gid,'coupon5'));const off=new RewardsService(pool,{...env,ARCADE_REWARDS_ENABLED:'false'},{shopify});await assert.rejects(off.reserve(gid,'coupon5'));assert.equal(issued,0)});
 await t.test('concurrent reservation spends points once and returns the same weekly claim',async()=>{await reset();await pool.query('UPDATE arcade_accounts SET balance=6000,wins=60,days=20 WHERE customer_gid=$1',[gid]);const [a,b]=await Promise.all([service.reserve(gid,'coupon5'),service.reserve(gid,'coupon5')]);assert.equal(a.id,b.id);assert.equal((await service.profile(gid)).balance,5000);await assert.rejects(service.reserve(gid,'coupon10'));});
 await t.test('global weekly capacity rejects new reservations without spending points',async()=>{await reset();const limited=new RewardsService(pool,{...env,MAX_COUPONS_PER_WEEK:'1'},{shopify});await pool.query('UPDATE arcade_accounts SET balance=2000,wins=20,days=10 WHERE customer_gid=$1',[gid]);await limited.reserve(gid,'coupon5');const other='gid://shopify/Customer/200';await pool.query('INSERT INTO arcade_accounts(customer_gid,balance,wins,days) VALUES($1,2000,20,10)',[other]);await assert.rejects(limited.reserve(other,'coupon5'));assert.equal((await limited.profile(other)).balance,2000);assert.equal((await limited.profile(gid)).balance,1000)});
 await t.test('Shopify timeout keeps stable code for safe reconciliation/retry',async()=>{await reset();await pool.query('UPDATE arcade_accounts SET balance=2000,wins=10,days=3 WHERE customer_gid=$1',[gid]);const r=await service.reserve(gid,'coupon5');fail=true;await assert.rejects(service.issue(gid,r.id));const result=await service.issue(gid,r.id);assert.equal(result.code,seen[0]);assert.equal(seen[0],seen[1]);assert.equal((await service.profile(gid)).balance,1000);assert.equal((await service.issue(gid,r.id)).code,result.code);assert.equal(issued,2)});
 await t.test('gift request reserves points, requires manual approved variant, rejection refunds exactly once',async()=>{await reset();await pool.query('UPDATE arcade_accounts SET balance=12000,wins=110,days=40 WHERE customer_gid=$1',[gid]);const r=await service.reserve(gid,'bathbomb');assert.equal(r.status,'pending');assert.equal((await service.profile(gid)).balance,2000);await assert.rejects(service.issue(gid,r.id));await assert.rejects(service.approve(r.id,'not-approved'));await service.approve(r.id,null,true);assert.equal((await service.profile(gid)).balance,12000);await assert.rejects(service.approve(r.id,null,true));const next=await service.reserve(gid,'bathbomb');await service.approve(next.id,'gid://shopify/ProductVariant/1');await service.issue(gid,next.id);assert.equal(issued,1);await assert.rejects(service.reserve(gid,'bathbomb'))});
 await t.test('deleted accounts lose personal progress and cannot reset reward eligibility',async()=>{await reset();await service.remove(gid);assert.equal((await pool.query('SELECT * FROM arcade_accounts')).rows.length,0);assert.equal((await pool.query('SELECT * FROM arcade_deleted_accounts')).rows.length,1);const state=await service.beginLogin();const p=signed({shop:env.SHOPIFY_SHOP,timestamp:String(Math.floor(Date.now()/1000)),logged_in_customer_id:'100',state},env.SHOPIFY_API_SECRET);const code=await service.proxyLogin(p);await assert.rejects(service.exchange(code,state));});
 }finally{await pool.end()}
});

test('Android package bundles all 36 actual games and excludes reward client and sensitive permissions',()=>{
 const path=__dirname+'/../android/app/src/main/assets/',html=fs.readFileSync(path+'index.html','utf8'),manifest=fs.readFileSync(__dirname+'/../android/app/src/main/AndroidManifest.xml','utf8');
 assert(!html.includes('rewards.js'));assert(!html.includes('offline.js'));assert(!html.includes('id="rewardsPanel"'));assert(!fs.existsSync(path+'rewards.js'));assert(!manifest.includes('uses-permission'));assert(fs.existsSync(path+'new-games.js'));assert(!fs.readFileSync(path+'app.js','utf8').includes('Illustrative '));
});

test('multiple real game engines replay consistently, including Spanish word games and keyboard moves',async()=>{
 const {verifyReplay}=await import('../rewards/replay.js');
 for(const [game,language] of [['wordsearch','en'],['wordsearch','es'],['queens','en'],['hanoi','en'],['maze','en']]){
  const h=setup();h.window.AquaLanguage={language};h.open(game);const events=[];let clock=20000;
  const click=b=>{const area=b.closest('#board,#gameControls');assert(area);const index=[...area.querySelectorAll('button,input,select')].indexOf(b);events.push({kind:'click',area:area.id,index,t:clock+=60});h.click(b)};
  if(game==='queens')[0,4,7,5,2,6,1,3].forEach((c,r)=>click(h.buttons()[r*8+c]));
  if(game==='hanoi'){function move(n,from,to,spare){if(!n)return;move(n-1,from,spare,to);click(h.buttons()[from]);click(h.buttons()[to]);move(n-1,spare,to,from)}move(5,0,2,1)}
  if(game==='maze'){
   const bs=h.buttons(),dirs=[[-1,0],[0,1],[1,0],[0,-1]],names=['↑','→','↓','←'],queue=[[0,[]]],seen=new Set([0]);let path;
   while(queue.length){const [i,p]=queue.shift();if(i===80){path=p;break}for(let k=0;k<4;k++){const r=Math.floor(i/9)+dirs[k][0],c=i%9+dirs[k][1],j=r*9+c;if(r>=0&&r<9&&c>=0&&c<9&&!bs[j].classList.contains('wall')&&!seen.has(j)){seen.add(j);queue.push([j,[...p,k]])}}}
   for(const [step,k] of path.entries()){if(step%2)click(h.control(names[k]));else{const key=['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'][k];events.push({kind:'key',value:key,t:clock+=60});const e=new h.window.Event('keydown',{bubbles:true});e.key=key;h.document.dispatchEvent(e)}}
  }
  if(game==='wordsearch'){
   const words=h.document.querySelector('.word-list').textContent.split(' · '),letters=h.buttons().map(b=>b.textContent);
   for(const word of words){let pair;
    for(let i=0;i<81&&!pair;i++)for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1],[0,-1],[-1,0],[-1,-1],[-1,1]]){const path=Array.from(word,(_,k)=>[Math.floor(i/9)+dr*k,i%9+dc*k]);if(path.every(([r,c],k)=>r>=0&&r<9&&c>=0&&c<9&&letters[r*9+c]===word[k])){pair=[i,path.at(-1)[0]*9+path.at(-1)[1]];break}}
    assert(pair);click(h.buttons()[pair[0]]);click(h.buttons()[pair[1]]);
   }
  }
  assert(h.done());const result=await verifyReplay({game,seed:1234567,language,events});assert(result.won,game+' '+language+': '+result.error);
 }
});

test('web rewards client records the actual clicked moves and submits a replay instead of local totals',async()=>{
 const h=setup();h.window.__clock=0;h.window.__requests=[];
 h.run(`navigator.onLine=true;globalThis.performance={now:()=>window.__clock};globalThis.fetch=async(path,options={})=>{
  const data=options.body?JSON.parse(options.body):undefined;window.__requests.push({path,data});
  let body=path.endsWith('/status')?{accountsReady:true,enabled:true,verifiedGames:['focus']}:path.endsWith('/me')?{balance:0,stars:0,wins:0,days:0,streak:0,rewards:[],claims:[]}:path.endsWith('/start')?{id:'00000000-0000-4000-8000-000000000001',seed:1234567}:{credited:true,earned:25};
  return {ok:true,json:async()=>body};
 };`);
 h.run(fs.readFileSync(__dirname+'/../public/rewards.js','utf8'));
 await new Promise(r=>setImmediate(r));await h.run(`open('focus')`);
 for(let v=1;v<=16;v++){h.window.__clock=21000+v*100;const b=h.buttons().find(b=>b.textContent===String(v));b.click()}
 await new Promise(r=>setImmediate(r));
 const submitted=h.window.__requests.find(r=>r.path.endsWith('/finish'));assert(submitted,'win submitted');
 assert.equal(submitted.data.events.length,16);assert(!('stars' in submitted.data));assert(!('customerId' in submitted.data));
 const {verifyReplay}=await import('../rewards/replay.js');assert((await verifyReplay({game:'focus',seed:1234567,language:'en',events:submitted.data.events})).won);
});
