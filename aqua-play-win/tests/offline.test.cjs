const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('Offline: use a complete cached release, ignore reward APIs and cache the expanded library',async()=>{const events={},network=[],cached=new Map([['/index.html','release HTML'],['/app.js','release app'],['/new-games.js','release games']]);let assets=[];const cache={match:async k=>cached.get(k),addAll:async a=>assets=a};const ctx=vm.createContext({URL,self:{location:{origin:'https://arcade.test'},addEventListener:(k,fn)=>events[k]=fn,skipWaiting:async()=>{},clients:{claim:async()=>{}}},caches:{open:async()=>cache,keys:async()=>[],delete:async()=>true},fetch:async r=>{network.push(r);return 'new network version'}});vm.runInContext(fs.readFileSync(__dirname+'/../public/sw.js','utf8'),ctx);let installing;events.install({waitUntil:p=>installing=p});await installing;assert(assets.includes('/new-games.js'));assert(assets.includes('/game-art.svg'));async function request(path,mode){let result;events.fetch({request:{method:'GET',url:'https://arcade.test'+path,mode},respondWith:p=>result=p});return result}assert.equal(await request('/','navigate'),'release HTML');assert.equal(await request('/app.js?v=6'),'release app');assert.equal(await request('/new-games.js?v=1'),'release games');assert.equal(await request('/api/rewards/status'),undefined);assert.equal(network.length,0)});

test('Every game illustration resolves to a local symbol in both web and offline Android packages',()=>{
 const {setup}=require('./helpers.cjs'),{parseHTML}=require('linkedom'),g=setup();
 const web=fs.readFileSync(__dirname+'/../public/game-art.svg','utf8');
 const {document}=parseHTML(web);
 const ids=Array.from(g.run('Object.keys(keys)'));
 assert.equal(document.querySelectorAll('symbol').length,ids.length);
 for(const id of ids)assert(document.querySelector('symbol#'+id),'Missing board illustration: '+id);
 assert.equal(fs.readFileSync(__dirname+'/../android/app/src/main/assets/game-art.svg','utf8'),web);
});
