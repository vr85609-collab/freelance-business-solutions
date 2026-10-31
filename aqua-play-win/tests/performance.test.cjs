const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {setup}=require('./helpers.cjs');
test('Completed game timers release their cleanup closures; pending timers still cancel on exit',()=>{
 const g=setup();g.open('sequence');g.advance(4000);
 const before=g.run('cleanupTasks.length');
 g.run('for(let i=0;i<500;i++)gameTimeout(()=>{},1)');
 assert.equal(g.run('cleanupTasks.length'),before+500);g.advance(2);
 assert.equal(g.run('cleanupTasks.length'),before);
 g.run('gameTimeout(()=>{throw Error("stale timer ran")},1000)');g.run('home()');g.advance(1100);
 assert.equal(g.run('cleanupTasks.length'),0);
});
test('Light effects and optional sound survive reload, reduced motion blocks animation, switching cancels live effects',()=>{
 const g=setup(),store=new Map(),events={},media={matches:false,addEventListener(){}};let count=0,cancelled=0;
 g.run(`window.matchMedia=()=>({matches:false,addEventListener(){}})`);
 g.window.matchMedia=()=>media;
 // Use the same DOM, but keep browser-only globals explicit in this presentation test.
 const context=vm.createContext({window:g.window,document:g.document,navigator:{deviceMemory:2},localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)}});
 const code=fs.readFileSync(__dirname+'/../public/experience.js','utf8');vm.runInContext(code,context);
 const light=g.document.getElementById('effectsToggle'),sound=g.document.getElementById('soundToggle');
 assert.equal(light.getAttribute('aria-pressed'),'true');assert.equal(sound.getAttribute('aria-pressed'),'false');
 const target=g.document.getElementById('feedback');target.animate=()=>{count++;return {cancel(){cancelled++}}};
 g.window.AquaExperience.celebrate();assert.equal(count,0);
 light.onclick();g.window.AquaExperience.celebrate();assert.equal(count,1);
 light.onclick();assert.equal(cancelled,1);
 light.onclick();media.matches=true;g.window.AquaExperience.celebrate();assert.equal(count,1);
 assert.equal(JSON.parse(store.get('aqua_experience_v1')).light,false);
 g.document.documentElement.lang='es';g.window.dispatchEvent(new g.window.CustomEvent('aqua-language-changed'));assert.match(light.textContent,/Efectos ligeros/);
});
