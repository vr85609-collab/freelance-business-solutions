const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('Offline: use a complete cached release, ignore reward APIs and cache the expanded library',async()=>{const events={},network=[],cached=new Map([['/index.html','release HTML'],['/app.js','release app'],['/new-games.js','release games']]);let assets=[];const cache={match:async k=>cached.get(k),addAll:async a=>assets=a};const ctx=vm.createContext({URL,self:{location:{origin:'https://arcade.test'},addEventListener:(k,fn)=>events[k]=fn,skipWaiting:async()=>{},clients:{claim:async()=>{}}},caches:{open:async()=>cache,keys:async()=>[],delete:async()=>true},fetch:async r=>{network.push(r);return 'new network version'}});vm.runInContext(fs.readFileSync(__dirname+'/../public/sw.js','utf8'),ctx);let installing;events.install({waitUntil:p=>installing=p});await installing;assert(assets.includes('/new-games.js'));assert(assets.includes('/game-art.svg'));async function request(path,mode){let result;events.fetch({request:{method:'GET',url:'https://arcade.test'+path,mode},respondWith:p=>result=p});return result}assert.equal(await request('/','navigate'),'release HTML');assert.equal(await request('/app.js?v=6'),'release app');assert.equal(await request('/new-games.js?v=1'),'release games');assert.equal(await request('/api/rewards/status'),undefined);for(const path of ['/android-privacy','/privacy','/rewards-admin','/rewards-admin.html','/not-a-game'])assert.equal(await request(path,'navigate'),undefined,path+' must reach the server instead of showing the game');assert.equal(network.length,0)});

test('Every game illustration resolves to a local symbol in both web and offline Android packages',()=>{
 const {setup}=require('./helpers.cjs'),{parseHTML}=require('linkedom'),g=setup();
 const web=fs.readFileSync(__dirname+'/../public/game-art.svg','utf8');
 const {document}=parseHTML(web);
 const ids=Array.from(g.run('Object.keys(keys)'));
 assert.equal(document.querySelectorAll('symbol').length,ids.length);
 for(const id of ids)assert(document.querySelector('symbol#'+id),'Missing board illustration: '+id);
 assert.equal(fs.readFileSync(__dirname+'/../android/app/src/main/assets/game-art.svg','utf8'),web);
});

test('Installed app updates stay visible outside collapsed offline details; first install stays quiet',()=>{
 const {parseHTML}=require('linkedom');
 for(const controlled of [false,true]){
  const {document}=parseHTML(fs.readFileSync(__dirname+'/../public/index.html','utf8'));
  const listeners={},workerEvents={};let reloads=0;
  const navigator={onLine:true,serviceWorker:{controller:controlled?{}:null,addEventListener:(name,fn)=>workerEvents[name]=fn,register:async()=>({})}};
  const ctx=vm.createContext({document,navigator,window:{addEventListener:(name,fn)=>listeners[name]=fn},location:{protocol:'https:',hostname:'arcade.test',reload:()=>reloads++},console});
  vm.runInContext(fs.readFileSync(__dirname+'/../public/offline.js','utf8'),ctx);
  workerEvents.controllerchange();workerEvents.controllerchange();
  assert.equal(document.querySelectorAll('#updateApp').length,controlled?1:0);
  if(controlled){const button=document.querySelector('#updateApp');assert(!button.closest('details'));assert.match(document.querySelector('.app-update').textContent,/Finish your game/);button.onclick();assert.equal(reloads,1)}
 }
});
