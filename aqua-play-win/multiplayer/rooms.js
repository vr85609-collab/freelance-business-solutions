import {randomBytes,randomInt,timingSafeEqual} from 'node:crypto';
import rules from '../shared/multiplayer-rules.cjs';
const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const secret=()=>randomBytes(32).toString('base64url');
const same=(a,b)=>typeof a==='string'&&/^[A-Za-z0-9_-]{43}$/.test(a)&&typeof b==='string'&&a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
export function createRoomService({now=Date.now,maxRooms=500,idleMs=30*60_000,lifetimeMs=2*60*60_000}={}){
 const rooms=new Map(),rates=new Map();
 function sweep(){const at=now();for(const [code,r] of rooms)if(at-r.touched>=idleMs||at-r.created>=lifetimeMs)rooms.delete(code);for(const [key,r] of rates)if(at-r.start>=60_000)rates.delete(key);}
 function rate(key,max){const at=now();let r=rates.get(key);if(!r||at-r.start>=60_000){if(rates.size>=2048)sweep();if(rates.size>=2048)throw Object.assign(Error('Please try again shortly'),{status:429});r={start:at,count:0};rates.set(key,r);}if(++r.count>max)throw Object.assign(Error('Please slow down'),{status:429});}
 function view(r){return {code:r.code,state:r.state,revision:r.revision,joined:!!r.tokens[1],rematch:[...r.rematch],online:r.seen.map(t=>t!==null&&now()-t<12_000),expiresAt:Math.min(r.created+lifetimeMs,r.touched+idleMs)};}
 function get(code){sweep();const r=rooms.get(code);if(!r)throw Object.assign(Error('Room expired or unavailable'),{status:404});return r;}
 function access(code,token){const r=get(code),seat=r.tokens.findIndex(t=>t&&same(token,t))+1;if(!seat)throw Object.assign(Error('Room expired or unavailable'),{status:404});rate('seat:'+token,100);r.touched=now();r.seen[seat-1]=now();return {r,seat};}
 return {
  sweep,
  create(game,ip='local'){sweep();rate('create:'+ip,30);if(rooms.size>=maxRooms)throw Object.assign(Error('Rooms are busy. Please try later'),{status:429});const state=rules.fresh(game);let code;do{code=Array.from({length:8},()=>alphabet[randomInt(alphabet.length)]).join('');}while(rooms.has(code));const token=secret(),at=now(),r={code,state,revision:0,tokens:[token,null],created:at,touched:at,seen:[at,null],rematch:[false,false],actions:new Map(),starter:1};rooms.set(code,r);return {room:view(r),seat:1,token};},
  join(code,ip='local'){rate('join:'+ip,60);const r=get(code);if(r.tokens[1])throw Object.assign(Error('Room already has two players'),{status:409});const token=secret();r.tokens[1]=token;r.seen[1]=now();r.touched=now();r.revision++;return {room:view(r),seat:2,token};},
  read(code,token){const {r}=access(code,token);return {room:view(r)};},
  action(code,token,data){
   const {r,seat}=access(code,token);
   if(!data||typeof data.requestId!=='string'||!/^[a-zA-Z0-9_-]{16,64}$/.test(data.requestId))throw Error('Invalid move identifier');
   const id=seat+':'+data.requestId;
   if(r.actions.has(id)){if(r.actions.get(id)!==JSON.stringify(data))throw Object.assign(Error('Move identifier already used'),{status:409});return {room:view(r)};}
   if(!r.tokens[1])throw Error('Waiting for your friend');
   if(data.revision!==r.revision)throw Object.assign(Error('The board changed. Please try your move again'),{status:409});
   if(data.kind==='move')r.state=rules.play(r.state,seat,data.move);
   else if(data.kind==='rematch'){
    if(r.state.winner===null)throw Error('Finish this match first');r.rematch[seat-1]=true;
    if(r.rematch.every(Boolean)){r.state=rules.fresh(r.state.game);r.starter=3-r.starter;r.state.next=r.starter;r.rematch=[false,false];}
   }else throw Error('Unknown room action');
   r.revision++;r.actions.set(id,JSON.stringify(data));if(r.actions.size>64)r.actions.delete(r.actions.keys().next().value);
   return {room:view(r)};
  },
  get size(){sweep();return rooms.size;}
 };
}
export function createMultiplayerHandler(options={}){
 const rooms=createRoomService(options);
 const timer=setInterval(()=>rooms.sweep(),60_000);timer.unref();
 const send=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));};
 return async function handle(req,res,url){
  if(!url.pathname.startsWith('/api/multiplayer/'))return false;
  try{
   const origin=req.headers.origin;if(origin){let host;try{host=new URL(origin).host;}catch{throw Error('Invalid origin');}if(host!==req.headers.host)throw Object.assign(Error('Origin not allowed'),{status:403});}
   const path=url.pathname.slice('/api/multiplayer/'.length),parts=path.split('/');
   if(req.method==='GET'&&path==='status'){send(res,200,{available:true,version:'friends-v1',games:Object.keys(rules.games),temporaryRooms:true});return true;}
   let data;
   if(req.method==='POST'){
    if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))throw Object.assign(Error('JSON required'),{status:415});
    let raw='';for await(const part of req){raw+=part;if(Buffer.byteLength(raw)>2048)throw Object.assign(Error('Request too large'),{status:413});}data=JSON.parse(raw||'{}');
   }
   const ip=req.socket.remoteAddress||'unknown';
   if(req.method==='POST'&&path==='rooms'){send(res,201,rooms.create(data.game,ip));return true;}
   if(parts[0]!=='rooms'||!/^[A-HJ-NP-Z2-9]{8}$/.test(parts[1]||''))throw Object.assign(Error('Room expired or unavailable'),{status:404});
   const code=parts[1],token=(req.headers.authorization||'').replace(/^Bearer /,'');
   if(req.method==='POST'&&parts.length===3&&parts[2]==='join')send(res,200,rooms.join(code,ip));
   else if(req.method==='GET'&&parts.length===2)send(res,200,rooms.read(code,token));
   else if(req.method==='POST'&&parts.length===3&&parts[2]==='actions')send(res,200,rooms.action(code,token,data));
   else send(res,404,{error:'Not found'});
  }catch(e){send(res,e.status||400,{error:e.message||'Multiplayer unavailable'});}
  return true;
 };
}
