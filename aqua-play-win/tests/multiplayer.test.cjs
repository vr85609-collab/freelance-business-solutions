const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const rules=require('../shared/multiplayer-rules.cjs');
const {setup}=require('./helpers.cjs');
test('Shared versus rules enforce legal turns, gravity, wins and draws',()=>{
 let s=rules.fresh('tictac');assert.throws(()=>rules.play(s,2,0),/turn/);for(const move of [0,3,1,4,2])s=rules.play(s,s.next,move);assert.equal(s.winner,1);assert.throws(()=>rules.play(s,2,5),/finished/);
 s=rules.fresh('tictac');for(const move of [0,1,2,4,3,5,7,6,8])s=rules.play(s,s.next,move);assert.equal(s.winner,0);
 s=rules.fresh('connect');for(const move of [0,1,0,1,0,1,0])s=rules.play(s,s.next,move);assert.equal(s.winner,1);assert.equal(s.cells[35],1);assert.equal(s.cells[14],1);
 s=rules.fresh('connect');for(let i=0;i<6;i++)s=rules.play(s,s.next,0);assert.throws(()=>rules.play(s,s.next,0),/Illegal/);assert.throws(()=>rules.play(s,s.next,-1),/Illegal/);
});
test('Reversi captures, auto-passes and terminates through real legal play',()=>{
 let passed=false;
 for(let game=0;game<24;game++){
  let s=rules.fresh('reversi');assert.equal(rules.legal(s).length,4);s=rules.play(s,1,19);assert.equal(s.cells[27],1);assert.throws(()=>rules.play(s,s.next,0),/Illegal/);
  let count=0;while(s.winner===null){const legal=rules.legal(s);assert(legal.length);s=rules.play(s,s.next,legal[(count*7+game)%legal.length]);passed ||= !!s.passed;assert(++count<64);}
  const a=s.cells.filter(x=>x===1).length,b=s.cells.filter(x=>x===2).length;assert.equal(s.winner,a===b?0:a>b?1:2);
 }
 assert(passed,'Exercise the automatic pass rule');
});
test('Friend rooms authenticate seats, reject stale/duplicate/forged moves and require two rematch votes',async()=>{
 const {createRoomService}=await import('../multiplayer/rooms.js');const service=createRoomService();const a=service.create('tictac'),code=a.room.code;assert.equal(a.token.length,43);assert(!JSON.stringify(a.room).includes(a.token));
 assert.throws(()=>service.action(code,a.token,{kind:'move',move:0,revision:0,requestId:'aaaaaaaaaaaaaaaa'}),/Waiting/);
 const b=service.join(code);assert.equal(b.seat,2);assert.throws(()=>service.join(code),/two players/);assert.throws(()=>service.read(code,'outsider'),/unavailable/);
 let revision=b.room.revision,serial=0;
 const act=(p,kind,move)=>{const data={kind,move,revision,requestId:'move'+String(++serial).padStart(16,'0')};const reply=service.action(code,p.token,data);revision=reply.room.revision;return {reply,data};};
 const first=act(a,'move',0);assert.equal(service.action(code,a.token,first.data).room.state.ply,1);assert.throws(()=>service.action(code,a.token,{...first.data,move:1}),/already used/);
 assert.throws(()=>service.action(code,b.token,{kind:'move',move:3,revision:0,requestId:'bbbbbbbbbbbbbbbb'}),/board changed/);
 assert.throws(()=>act(a,'move',1),/turn/);
 for(const [p,m] of [[b,3],[a,1],[b,4],[a,2]])act(p,'move',m);
 assert.equal(service.read(code,a.token).room.state.winner,1);
 act(a,'rematch');assert.equal(service.read(code,a.token).room.state.winner,1);act(b,'rematch');const s=service.read(code,b.token).room.state;assert.equal(s.winner,null);assert.equal(s.ply,0);assert.equal(s.next,2);
});
test('Rooms expire, capacity is bounded and failed moves never alter the board',async()=>{
 const {createRoomService}=await import('../multiplayer/rooms.js');let time=0;const service=createRoomService({now:()=>time,maxRooms:1,idleMs:100,lifetimeMs:500});const a=service.create('connect');assert.throws(()=>service.create('tictac'),/busy/);const b=service.join(a.room.code);const before=service.read(a.room.code,a.token).room;
 assert.throws(()=>service.action(a.room.code,a.token,{kind:'move',move:99,revision:b.room.revision,requestId:'aaaaaaaaaaaaaaaa'}),/Illegal/);assert.deepEqual(service.read(a.room.code,a.token).room.state,before.state);time=101;assert.equal(service.size,0);assert.throws(()=>service.read(a.room.code,a.token),/expired/);assert(service.create('reversi'));
});
test('Two real HTTP clients join and exchange authoritative moves; origins, auth and request bodies are checked',async()=>{
 const {createMultiplayerHandler}=await import('../multiplayer/rooms.js'),http=require('node:http');const handle=createMultiplayerHandler();const server=http.createServer((req,res)=>handle(req,res,new URL(req.url,'http://localhost')));await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/api/multiplayer/';
 const request=async(path,data,token,origin)=>{const r=await fetch(base+path,{method:data?'POST':'GET',headers:{...(data?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{}),...(origin?{Origin:origin}:{})},...(data?{body:JSON.stringify(data)}:{})});return {status:r.status,body:await r.json()};};
 try{
  const a=await request('rooms',{game:'connect'});assert.equal(a.status,201);const code=a.body.room.code,b=await request('rooms/'+code+'/join',{});assert.equal(b.status,200);assert.equal((await request('rooms/'+code)).status,404);
  const turn=await request('rooms/'+code+'/actions',{kind:'move',move:2,revision:b.body.room.revision,requestId:'aaaaaaaaaaaaaaaa'},a.body.token);assert.equal(turn.status,200);const seen=await request('rooms/'+code,undefined,b.body.token);assert.equal(seen.body.room.state.cells[37],1);assert.equal(seen.body.room.state.next,2);
  assert.equal((await request('rooms',{game:'tictac'},undefined,'https://another-site.example')).status,403);
  const bad=await fetch(base+'rooms',{method:'POST',body:'{}'});assert.equal(bad.status,415);
 }finally{await new Promise(r=>server.close(r));}
});
test('Multiplayer category launches three offline human games, awards no prizes, translates and cleans up',()=>{
 const g=setup();g.run(fs.readFileSync(__dirname+'/../shared/multiplayer-rules.cjs','utf8'));g.run('globalThis.location={search:"",origin:"https://arcade.test"};globalThis.URLSearchParams=class {get(){return null}}');g.run(fs.readFileSync(__dirname+'/../public/multiplayer.js','utf8'));g.run(fs.readFileSync(__dirname+'/../public/catalog.js','utf8'));
 g.document.querySelector('[data-category="Multiplayer"]').onclick();assert.equal(g.document.body.dataset.mode,'multiplayer');assert.equal(g.document.querySelectorAll('[data-mp-game]').length,3);
 const game=g.document.getElementById('mpGame');game.querySelector('[value="tictac"]').selected=true;g.document.getElementById('mpLocal').onclick();for(const i of [0,3,1,4,2])g.document.querySelectorAll('#mpBoard button')[i].onclick();assert.match(g.document.getElementById('mpStatus').textContent,/Player 1 wins/);assert.equal(g.run('progress.stars'),0);
 g.document.getElementById('mpLobbyButton').onclick();game.querySelector('[value="connect"]').selected=true;g.document.getElementById('mpLocal').onclick();for(const col of [0,1,0,1,0,1,0])g.document.querySelectorAll('#mpColumns button')[col].onclick();assert.match(g.document.getElementById('mpStatus').textContent,/Player 1 wins/);
 g.document.getElementById('mpLobbyButton').onclick();game.querySelector('[value="reversi"]').selected=true;g.document.getElementById('mpLocal').onclick();assert.equal(g.document.querySelectorAll('#mpBoard button:not(:disabled)').length,4);
 g.document.documentElement.lang='es';g.window.dispatchEvent(new g.window.CustomEvent('aqua-language-changed'));assert.equal(g.document.getElementById('mpHeading').textContent,'Multijugador');g.run('home()');assert.equal(g.document.getElementById('multiplayerPanel').hidden,true);
});
