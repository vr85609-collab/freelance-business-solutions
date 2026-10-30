import {randomBytes,randomInt,randomUUID,createHash,createHmac,timingSafeEqual} from 'node:crypto';
import {POLICY,REWARD_PRODUCTS,dayKey,priorDay,weekKey,eligibility,ineligibleGames} from './policy.js';
import {verifyReplay} from './replay.js';
import {ShopifyRewards,hasShopifyCredentials} from './shopify.js';
const hash=s=>createHash('sha256').update(s).digest('hex');
const token=()=>randomBytes(32).toString('base64url');
export function verifyProxy(params,env,now=Date.now()) {
 const seen=new Set();for(const [key] of params){if(seen.has(key))throw Error('Duplicate proxy parameter');seen.add(key)}
 const signature=params.get('signature');if(!/^[a-f0-9]{64}$/.test(signature||''))throw Error('Invalid proxy signature');
 const message=[...params].filter(([k])=>k!=='signature').map(([k,v])=>k+'='+v).sort().join('');
 const expected=createHmac('sha256',env.SHOPIFY_API_SECRET||'').update(message).digest();
 if(!env.SHOPIFY_API_SECRET||!timingSafeEqual(expected,Buffer.from(signature,'hex')))throw Error('Invalid proxy signature');
 if(params.get('shop')!==env.SHOPIFY_SHOP||Math.abs(now-Number(params.get('timestamp'))*1000)>300000||!/^\d+$/.test(params.get('timestamp')||''))throw Error('Invalid proxy context');
 const customer=params.get('logged_in_customer_id');if(!/^\d+$/.test(customer||''))throw Error('Sign in to your Shopify customer account first');
 return 'gid://shopify/Customer/'+customer;
}
export function discountInput(claim,now=new Date()) {
 const common={title:'Aqua Arcade '+claim.reward_id,code:claim.code,context:{customers:{add:[claim.customer_gid]}},
  startsAt:now.toISOString(),endsAt:new Date(now.getTime()+POLICY.expiryHours*3600000).toISOString(),usageLimit:1,appliesOncePerCustomer:true,
  combinesWith:{orderDiscounts:false,productDiscounts:false,shippingDiscounts:false}};
 const items={products:{productVariantsToAdd:REWARD_PRODUCTS.map(p=>p.id)}};
 if(claim.reward_id==='bathbomb'){
  if(!REWARD_PRODUCTS.some(p=>p.id===claim.variant_gid))throw Error('Gift product is not approved');
  return {...common,usesPerOrderLimit:1,
   customerBuys:{items,value:{quantity:String(POLICY.giftBuyQuantity)},isOneTimePurchase:true,isSubscription:false},
   customerGets:{items:{products:{productVariantsToAdd:[claim.variant_gid]}},appliesOnOneTimePurchase:true,appliesOnSubscription:false,value:{discountOnQuantity:{quantity:'1',effect:{percentage:1}}}}};
 }
 const r=POLICY.rewards.find(r=>r.id===claim.reward_id);if(!r?.amount)throw Error('Unknown coupon');
 return {...common,customerGets:{items,appliesOnOneTimePurchase:true,appliesOnSubscription:false,value:{discountAmount:{amount:r.amount,appliesOnEachItem:false}}},minimumRequirement:{subtotal:{greaterThanOrEqualToSubtotal:r.minimumPurchase}}};
}
export class RewardsService {
 constructor(pool,env=process.env,{shopify=new ShopifyRewards(env),verify=verifyReplay,clock=()=>new Date()}={}){this.pool=pool;this.env=env;this.shopify=shopify;this.verify=verify;this.clock=clock}
 async tx(fn){const c=await this.pool.connect();try{await c.query('BEGIN');const result=await fn(c);await c.query('COMMIT');return result}catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}}
 async query(q,p=[]){return this.pool.query(q,p)}
 fraudHash(gid){return createHmac('sha256',this.env.ARCADE_FRAUD_SALT).update(gid).digest('hex')}
 async beginLogin(){const raw=token();await this.query('INSERT INTO arcade_login_requests(state_hash) VALUES($1)',[hash(raw)]);return raw}
 async proxyLogin(params){const gid=verifyProxy(params,this.env,this.clock().getTime()),state=params.get('state'),code=token();
  if(!state)throw Error('Start sign-in from Aqua Arcade');
  const r=await this.query('UPDATE arcade_login_requests SET code_hash=$1,customer_gid=$2 WHERE state_hash=$3 AND expires_at>now() RETURNING state_hash',[hash(code),gid,hash(state)]);
  if(!r.rowCount)throw Error('Sign-in expired');return code;
 }
 async exchange(code,state){return this.tx(async c=>{
  if(!code||!state)throw Error('Sign-in expired');
  const r=await c.query('DELETE FROM arcade_login_requests WHERE code_hash=$1 AND state_hash=$2 AND expires_at>now() RETURNING customer_gid',[hash(code),hash(state)]);
  if(!r.rowCount)throw Error('Sign-in expired');const gid=r.rows[0].customer_gid;
  const blocked=await c.query('SELECT customer_hash FROM arcade_deleted_accounts WHERE customer_hash=$1 AND expires_at>now()',[this.fraudHash(gid)]);
  if(blocked.rowCount)throw Error('This rewards account was closed. Contact support to reopen it.');
  await c.query('INSERT INTO arcade_accounts(customer_gid) VALUES($1) ON CONFLICT DO NOTHING',[gid]);
  const raw=token();await c.query('INSERT INTO arcade_logins(token_hash,customer_gid) VALUES($1,$2)',[hash(raw),gid]);return raw;
 })}
 async identity(raw){if(!raw)return null;return (await this.query('SELECT customer_gid FROM arcade_logins WHERE token_hash=$1 AND expires_at>now()',[hash(raw)])).rows[0]?.customer_gid||null}
 async logout(raw){if(raw)await this.query('DELETE FROM arcade_logins WHERE token_hash=$1',[hash(raw)])}
 async profile(gid){const a=(await this.query('SELECT balance,stars,wins,days,streak,last_day FROM arcade_accounts WHERE customer_gid=$1',[gid])).rows[0];
  if(!a)throw Error('Account unavailable');
  const day=dayKey(this.clock());if(a.last_day!==day&&a.last_day!==priorDay(day))a.streak=0;
  const claims=(await this.query('SELECT id,reward_id,status,code,expires_at,created_at FROM arcade_claims WHERE customer_gid=$1 ORDER BY created_at DESC LIMIT 30',[gid])).rows;
  return {...a,rewards:POLICY.rewards.map(r=>({...r,eligible:eligibility(a,r)})),claims};
 }
 async start(gid,game,language){
  if(!/^[a-z0-9]{2,16}$/.test(game||'')||ineligibleGames.has(game))throw Error('This game awards practice stars only');
  const count=(await this.query("SELECT count(*)::int AS n FROM arcade_challenges WHERE customer_gid=$1 AND created_at>now()-interval '1 hour'",[gid])).rows[0].n;
  if(count>=30)throw Error('Please take a break and try again later');
  const id=randomUUID(),seed=randomInt(0,4294967296);await this.query('INSERT INTO arcade_challenges(id,customer_gid,game,seed,language) VALUES($1,$2,$3,$4,$5)',[id,gid,game,seed,language==='es'?'es':'en']);return {id,seed};
 }
 async finish(gid,id,events){
  if(!/^[0-9a-f-]{36}$/.test(id||'')||!Array.isArray(events)||events.length>4000)throw Error('Invalid game proof');
  const s=(await this.query('SELECT * FROM arcade_challenges WHERE id=$1 AND customer_gid=$2',[id,gid])).rows[0];
  if(!s)throw Error('Game session not found');if(s.completed)return {credited:false,reason:'Already processed'};
  const elapsed=this.clock()-new Date(s.created_at);
  if(elapsed<POLICY.minimumGameSeconds*1000||elapsed>1200000||events.some(e=>e.t>elapsed+1000))throw Error('Game session timing invalid');
  const proof=await this.verify({game:s.game,seed:s.seed,language:s.language,events});if(!proof.won)throw Error('This result did not verify as a win');
  return this.tx(async c=>{
   const session=(await c.query('SELECT completed FROM arcade_challenges WHERE id=$1 FOR UPDATE',[id])).rows[0];
   if(session.completed)return {credited:false,reason:'Already processed'};
   const a=(await c.query('SELECT * FROM arcade_accounts WHERE customer_gid=$1 FOR UPDATE',[gid])).rows[0];
   await c.query('UPDATE arcade_challenges SET completed=true WHERE id=$1',[id]);
   const day=dayKey(this.clock()),daily=(await c.query("SELECT game FROM arcade_ledger WHERE customer_gid=$1 AND day=$2 AND reason='win'",[gid,day])).rows;
   if(daily.length>=POLICY.maxRewardWinsPerDay||daily.some(r=>r.game===s.game))return {credited:false,reason:'Daily reward limit reached; practice stars still count locally'};
   const newDay=a.last_day!==day,streak=newDay?(a.last_day===priorDay(day)?a.streak+1:1):a.streak;
   const earned=POLICY.starsPerWin+(newDay?POLICY.firstWinOfDayBonus:0)+(newDay&&streak%7===0?POLICY.sevenDayBonus:0);
   await c.query('INSERT INTO arcade_ledger(id,customer_gid,game,day,amount,reason,challenge_id) VALUES($1,$2,$3,$4,$5,$6,$7)',[randomUUID(),gid,s.game,day,earned,'win',id]);
   await c.query('UPDATE arcade_accounts SET balance=balance+$1,stars=stars+$1,wins=wins+1,days=days+$2,streak=$3,last_day=$4 WHERE customer_gid=$5',[earned,newDay?1:0,streak,day,gid]);
   return {credited:true,earned};
  });
 }
 enabled(){return this.env.ARCADE_REWARDS_ENABLED==='true'&&this.env.ARCADE_PROMOTION_TERMS_APPROVED==='true'&&hasShopifyCredentials(this.env)}
 async reserve(gid,rewardId){
  if(!this.enabled())throw Error('Coupon and gift redemption is not activated');
  const reward=POLICY.rewards.find(r=>r.id===rewardId);if(!reward)throw Error('Unknown reward');
  await this.shopify.reviewEconomics({reward_id:rewardId});
  return this.tx(async c=>{
   await c.query('SELECT pg_advisory_xact_lock(20261030)');
   const a=(await c.query('SELECT * FROM arcade_accounts WHERE customer_gid=$1 FOR UPDATE',[gid])).rows[0];
   const week=reward.approval?null:weekKey(dayKey(this.clock()));
   if(week){const existing=(await c.query('SELECT * FROM arcade_claims WHERE customer_gid=$1 AND week=$2',[gid,week])).rows[0];if(existing){if(existing.reward_id!==rewardId)throw Error('Weekly claim limit reached');return existing}}
   if(reward.approval&&(await c.query("SELECT id FROM arcade_claims WHERE customer_gid=$1 AND reward_id='bathbomb' AND status<>'rejected'",[gid])).rowCount)throw Error('Gift request already exists');
   if(!eligibility(a,reward))throw Error('Not enough verified points, wins, or days');
   if(week){const cap=Number(this.env.MAX_COUPONS_PER_WEEK||10);if(!Number.isInteger(cap)||cap<1)throw Error('Program limits are not configured correctly');
    const reserved=(await c.query("SELECT count(*)::int AS n FROM arcade_claims WHERE week=$1 AND status IN ('approved','issuing','issued')",[week])).rows[0].n;
    if(reserved>=cap)throw Error('Program weekly limit reached. Your points were not spent');}

   const id=randomUUID();const r=await c.query('INSERT INTO arcade_claims(id,customer_gid,reward_id,cost,week,status) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[id,gid,rewardId,reward.points,week,reward.approval?'pending':'approved']);
   await c.query('UPDATE arcade_accounts SET balance=balance-$1 WHERE customer_gid=$2',[reward.points,gid]);return r.rows[0];
  });
 }
 async approve(id,variant,reject=false){
  if(!this.enabled())throw Error('Redemption not activated');
  const gift=reject?null:await this.shopify.gift(variant);
  return this.tx(async c=>{
   const request=(await c.query("SELECT * FROM arcade_claims WHERE id=$1 AND reward_id='bathbomb' FOR UPDATE",[id])).rows[0];
   if(!request||request.status!=='pending')throw Error('Gift is not awaiting approval');
   if(reject){await c.query("UPDATE arcade_claims SET status='rejected' WHERE id=$1",[id]);await c.query('UPDATE arcade_accounts SET balance=balance+$1 WHERE customer_gid=$2',[request.cost,request.customer_gid]);}
   else await c.query("UPDATE arcade_claims SET status='approved',variant_gid=$2,amount=$3 WHERE id=$1",[id,gift.variant,gift.amount]);
   return {status:reject?'rejected':'approved'};
  });
 }
 async issue(gid,id){
  if(!this.enabled())throw Error('Redemption not activated');
  // Serialize issuance globally and by customer while preparing, then release before network.
  const claim=await this.tx(async c=>{
   await c.query('SELECT pg_advisory_xact_lock(20261030)');
   await c.query('SELECT customer_gid FROM arcade_accounts WHERE customer_gid=$1 FOR UPDATE',[gid]);
   let r=(await c.query('SELECT * FROM arcade_claims WHERE id=$1 AND customer_gid=$2 FOR UPDATE',[id,gid])).rows[0];
   if(!r||!['approved','issuing','issued'].includes(r.status))throw Error('Reward is not approved');
   if(r.status==='issued'||r.status==='issuing')return r;
   const week=weekKey(dayKey(this.clock()));
   if(r.reward_id==='bathbomb'){
    // Recheck stock/price immediately before issuance; never charge more than one current unit.
    const gift=await this.shopify.gift(r.variant_gid);r.amount=gift.amount;
    const monthly=(await c.query("SELECT count(*)::int AS n FROM arcade_claims WHERE reward_id='bathbomb' AND status IN ('issuing','issued') AND issuance_at>now()-interval '30 days'")).rows[0].n;
    if(monthly>=Number(this.env.MAX_GIFTS_PER_30_DAYS||3))throw Error('Gift program limit reached');
   }
   const capacity=Number(this.env.MAX_COUPONS_PER_WEEK||10),giftCapacity=Number(this.env.MAX_GIFTS_PER_30_DAYS||3);
   if(!Number.isInteger(capacity)||capacity<1||!Number.isInteger(giftCapacity)||giftCapacity<1)throw Error('Program limits are not configured correctly');
   const count=(await c.query("SELECT count(*)::int AS n FROM arcade_claims WHERE week=$1 AND id<>$2 AND status IN ('approved','issuing','issued')",[week,id])).rows[0].n;
   if(count>=Number(this.env.MAX_COUPONS_PER_WEEK||10))throw Error('Program weekly limit reached');
   const code='AQUA-'+randomBytes(16).toString('hex').toUpperCase();r={...r,code};
   const input=discountInput(r,this.clock());
   r=(await c.query("UPDATE arcade_claims SET week=$2,status='issuing',issuance_at=now(),code=$3,expires_at=$4,shopify_input=$5,amount=$6 WHERE id=$1 RETURNING *",[id,week,code,input.endsAt,JSON.stringify(input),r.amount])).rows[0];return r;
  });
  if(claim.status!=='issued'){
   if(new Date(claim.expires_at)<=this.clock())throw Error('Issuance expired. Contact support with your claim ID.');
   const discount=await this.shopify.issue(claim);await this.query("UPDATE arcade_claims SET status='issued',discount_gid=$2 WHERE id=$1 AND status='issuing'",[id,discount]);
  }
  return {id:claim.id,code:claim.code,status:'issued',expiresAt:claim.expires_at,shopUrl:'https://aquaemoticons.com/discount/'+encodeURIComponent(claim.code)};
 }
 async gifts(){return (await this.query("SELECT c.id,c.customer_gid,c.status,c.created_at,a.balance,a.wins,a.days,a.streak FROM arcade_claims c JOIN arcade_accounts a USING(customer_gid) WHERE c.reward_id='bathbomb' ORDER BY c.created_at DESC LIMIT 100")).rows}
 async remove(gid){await this.tx(async c=>{
  await c.query('INSERT INTO arcade_deleted_accounts(customer_hash) VALUES($1) ON CONFLICT(customer_hash) DO UPDATE SET expires_at=now()+interval \'365 days\'',[this.fraudHash(gid)]);
  await c.query('DELETE FROM arcade_accounts WHERE customer_gid=$1',[gid]);
 })}
}
