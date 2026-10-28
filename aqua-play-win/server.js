import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {randomInt,randomUUID} from 'node:crypto';
const port=Number(process.env.PORT||3000);
const sessions=new Map();
const rewards=new Map();
const json=(res,status,obj)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(obj))};
const levels=[{name:'Starter',percent:5,min:0},{name:'Champion',percent:10,min:4},{name:'Legend',percent:15,min:7}];
async function body(req){let data='';for await(const chunk of req){data+=chunk;if(data.length>2048)throw Error('Request too large')}return JSON.parse(data||'{}')}
const server=http.createServer(async(req,res)=>{
 try{
 const url=new URL(req.url,'http://localhost');
 if(req.method==='POST'&&url.pathname==='/api/start'){
  const id=randomUUID();sessions.set(id,{secret:randomInt(1,5),round:0,wins:0,expires:Date.now()+10*60_000});return json(res,200,{id,round:1,options:4});
 }
 if(req.method==='POST'&&url.pathname==='/api/guess'){
  const {id,guess}=await body(req);const s=sessions.get(id);
  if(!s||s.expires<Date.now())return json(res,400,{error:'Session expired. Start a new game.'});
  if(!Number.isInteger(guess)||guess<1||guess>4)return json(res,400,{error:'Choose a number from 1 to 4.'});
  if(s.round>=10)return json(res,400,{error:'Game complete.'});
  const correct=guess===s.secret;s.wins+=Number(correct);s.round++;
  if(s.round===10){sessions.delete(id);const tier=[...levels].reverse().find(l=>s.wins>=l.min);const rewardId=randomUUID();rewards.set(rewardId,{percent:tier.percent,created:Date.now()});return json(res,200,{correct,wins:s.wins,finished:true,reward:{id:rewardId,percent:tier.percent,minimumPurchase:25,status:'demo-only'}})}
  s.secret=randomInt(1,5);return json(res,200,{correct,wins:s.wins,round:s.round+1,finished:false});
 }
 if(req.method==='GET'&&url.pathname==='/api/config')return json(res,200,{shop:'https://aquaemoticons.com',realDiscountsEnabled:false,minimumPurchase:25});
 if(req.method==='GET'&&(url.pathname==='/'||url.pathname==='/index.html')){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store, must-revalidate','Content-Security-Policy':"default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'"});res.end(await readFile(new URL('./public/index.html',import.meta.url)));return}
 if(req.method==='GET'&&url.pathname==='/theme.js'){res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store, must-revalidate'});res.end(await readFile(new URL('./public/theme.js',import.meta.url)));return}
 const offlineAssets={
  '/sw.js':['./public/sw.js','text/javascript; charset=utf-8'],
  '/offline.js':['./public/offline.js','text/javascript; charset=utf-8'],
  '/manifest.webmanifest':['./public/manifest.webmanifest','application/manifest+json'],
  '/icon.svg':['./public/icon.svg','image/svg+xml']
 };
 if(req.method==='GET'&&offlineAssets[url.pathname]){
  const [filepath,mime]=offlineAssets[url.pathname];
  res.writeHead(200,{'Content-Type':mime,'Cache-Control':url.pathname==='/sw.js'?'no-cache':'no-store, must-revalidate'});
  res.end(await readFile(new URL(filepath,import.meta.url)));return;
 }
 if(req.method==='GET'&&url.pathname==='/api/rewards/status')return json(res,200,{enabled:false,claimingEnabled:false,shop:'aquaemoticons.com',audience:'all verified Shopify customers',launch:'immediately after verification and security tests pass',minimumPurchaseUSD:25,discountTiers:[5,10,15],weeklyClaimsPerCustomer:1,codeUses:1,codeExpiryHours:72,combineWithOtherDiscounts:false,offlineScoresEligible:false,identityVerificationReady:false,persistentClaimsReady:false,shopifyApiReady:false,reason:'Customer identity, durable one-per-week claim records, and a secure server-side Shopify integration are not yet configured.'});
 if(req.method==='POST'&&url.pathname==='/api/rewards/claim')return json(res,503,{error:'Redemption not yet enabled. No code has been issued.',enabled:false});
 if(req.method==='GET'&&url.pathname==='/app.js'){res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store, must-revalidate'});res.end(await readFile(new URL('./public/app.js',import.meta.url)));return}
 json(res,404,{error:'Not found'});
 }catch(e){json(res,400,{error:e.message||'Invalid request'})}
});server.listen(port,()=>console.log(`Play & Win demo on http://localhost:${port}`));