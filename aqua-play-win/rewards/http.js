import {timingSafeEqual} from 'node:crypto';
import pg from 'pg';
import {RewardsService} from './service.js';
import {POLICY} from './policy.js';
const COOKIE='__Host-aqua-session',LOGIN='__Host-aqua-login';
const cookies=req=>Object.fromEntries((req.headers.cookie||'').split(';').map(s=>s.trim().split('=')));
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data))};
const redirect=(res,url)=>{res.writeHead(302,{Location:url,'Cache-Control':'no-store','Referrer-Policy':'no-referrer'});res.end()};
const pageLink=(res,href,label)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'"});res.end('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width"><title>Aqua Arcade sign-in</title><h1>Aqua Arcade</h1><p><a href="'+href.replaceAll('&','&amp;').replaceAll('\"','&quot;')+'">'+label+'</a></p><p>Continue in your browser to finish signing in.</p></html>')};
const cookie=(res,name,value,maxAge)=>res.setHeader('Set-Cookie',name+'='+value+'; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age='+maxAge);
export async function requestBody(req){let data='',size=0;for await(const chunk of req){size+=Buffer.byteLength(chunk);if(size>262144)throw Error('Request too large');data+=chunk}return JSON.parse(data||'{}')}
export function createRewardsHandler(env=process.env){
 const configured=!!env.DATABASE_URL&&!!env.SHOPIFY_SHOP&&!!env.SHOPIFY_API_SECRET&&!!env.APP_ORIGIN&&env.ARCADE_FRAUD_SALT?.length>=32;
 const pool=configured?new pg.Pool({connectionString:env.DATABASE_URL,max:8}):null;
 const service=pool?new RewardsService(pool,env):null;
 const rates=new Map();
 const allowed=new Set(['memory','sequence','lights','twenty','tictac','connect','recall','focus','code','slider','cards','blocks','wordsearch','wordtiles','sudoku','mines','reversi','gomoku','dots','fleet','nonogram','maze','crates','pipes','knight','queens','ladder','anagram','hangman','make24','gems','pegs','hanoi','nim']);
 return async(req,res,url)=>{
  if(!url.pathname.startsWith('/api/rewards/')&&url.pathname!=='/auth/shopify')return false;
  try {
   const now=Date.now(),ip=req.socket.remoteAddress||'unknown';let rate=rates.get(ip);if(!rate||rate.until<now){rate={n:0,until:now+60000};rates.set(ip,rate)}
   if(rates.size>10000)for(const [k,v] of rates)if(v.until<now)rates.delete(k);
   if(++rate.n>120){json(res,429,{error:'Too many requests. Try again in a minute.'});return true}
   if(req.method==='GET'&&url.pathname==='/api/rewards/status'){json(res,200,{enabled:!!service?.enabled(),accountsReady:configured,policy:POLICY,verifiedGames:[...allowed],reason:configured?'Online wins are independently replayed. Device-only progress cannot be redeemed.':'Verified accounts and rewards require deployment configuration.'});return true}
   if(!service){json(res,503,{error:'Verified rewards are being set up. Your practice games remain available.'});return true}
   if(url.pathname==='/auth/shopify'&&req.method==='GET'){
    let code;try{code=await service.proxyLogin(url.searchParams)}catch(e){if(e.message==='Sign in to your Shopify customer account first'&&url.searchParams.get('attempt')!=='1'){const returnTo='/apps/aqua-arcade?attempt=1&state='+encodeURIComponent(url.searchParams.get('state')||'');pageLink(res,'https://aquaemoticons.com/account/login?return_url='+encodeURIComponent(returnTo),'Sign in to your store account');return true}throw e}pageLink(res,env.APP_ORIGIN+'/api/rewards/callback?code='+encodeURIComponent(code),'Continue to Aqua Arcade');return true;
   }
   if(url.pathname==='/api/rewards/login'&&req.method==='GET'){
    const state=await service.beginLogin();cookie(res,LOGIN,state,300);
    redirect(res,'https://aquaemoticons.com/apps/aqua-arcade?state='+encodeURIComponent(state));return true;
   }
   if(url.pathname==='/api/rewards/callback'&&req.method==='GET'){
    const raw=await service.exchange(url.searchParams.get('code'),cookies(req)[LOGIN]);cookie(res,COOKIE,raw,28800);redirect(res,env.APP_ORIGIN+'/');return true;
   }
   const isAdmin=url.pathname.startsWith('/api/rewards/admin/');
   if(isAdmin){
    const actual=Buffer.from(req.headers.authorization||''),expected=Buffer.from('Bearer '+(env.ARCADE_ADMIN_TOKEN||''));
    if((env.ARCADE_ADMIN_TOKEN||'').length<32||actual.length!==expected.length||!timingSafeEqual(actual,expected)){json(res,401,{error:'Admin authorization required'});return true}
    if(req.method==='GET'&&url.pathname==='/api/rewards/admin/gifts'){json(res,200,{gifts:await service.gifts(),variants:(env.GIFT_VARIANT_ALLOWLIST||'').split(',').map(v=>v.trim()).filter(Boolean),storeDomain:env.SHOPIFY_SHOP});return true}
    if(req.method==='POST'&&url.pathname==='/api/rewards/admin/gifts'){const data=await requestBody(req);if(!['approve','reject'].includes(data.action))throw Error('Choose approve or reject');json(res,200,await service.approve(data.id,data.variantId,data.action==='reject'));return true}
    json(res,404,{error:'Not found'});return true;
   }
   const gid=await service.identity(cookies(req)[COOKIE]);if(!gid){json(res,401,{error:'Sign in with your Shopify customer account'});return true}
   if(req.method==='GET'&&url.pathname==='/api/rewards/me'){json(res,200,await service.profile(gid));return true}
   // Same-origin requests only; never accept a browser-supplied customer ID.
   if(req.method!=='POST'||req.headers.origin!==env.APP_ORIGIN){json(res,403,{error:'Same-origin request required'});return true}
   const data=await requestBody(req);
   if(url.pathname==='/api/rewards/logout'){await service.logout(cookies(req)[COOKIE]);cookie(res,COOKIE,'',0);json(res,200,{ok:true});return true}
   if(url.pathname==='/api/rewards/delete'){if(data.confirm!=='DELETE')throw Error('Confirm account deletion');await service.remove(gid);cookie(res,COOKIE,'',0);json(res,200,{ok:true});return true}
   if(url.pathname==='/api/rewards/start'){if(!allowed.has(data.game))throw Error('This game awards practice stars only');json(res,200,await service.start(gid,data.game,data.language));return true}
   if(url.pathname==='/api/rewards/finish'){json(res,200,await service.finish(gid,data.id,data.events));return true}
   if(url.pathname==='/api/rewards/claim'){
    const claim=data.claimId?{id:data.claimId}:await service.reserve(gid,data.rewardId);
    json(res,200,claim.status==='pending'?{id:claim.id,status:'pending'}:await service.issue(gid,claim.id));return true;
   }
   json(res,404,{error:'Not found'});return true;
  }catch(e){const safe=e.code?(['23505','23503'].includes(e.code)?'This reward request conflicts with an existing claim. Refresh your rewards.':'Rewards storage is unavailable. Please try again later.'):e.message;
   json(res,400,{error:safe?.includes('password')?'Rewards unavailable':safe||'Rewards unavailable'});return true}
 };
}
