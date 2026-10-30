const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');const {parseHTML}=require('linkedom');
function setup({brokenStorage=false}={}){
 const {window}=parseHTML(fs.readFileSync(__dirname+'/../public/index.html','utf8')),document=window.document;
 let now=0,serial=0,seed=1234567;const timers=new Map(),store=new Map(),math=Object.create(Math);math.random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
 const schedule=(fn,delay=0)=>{const id=++serial;timers.set(id,{fn,time:now+delay});return id};
 window.HTMLElement.prototype.scrollIntoView=function(){};window.HTMLElement.prototype.showModal=function(){this.open=true};window.HTMLElement.prototype.close=function(){this.open=false};window.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});
 const context=vm.createContext({window,document,Math:math,console,navigator:{onLine:false},localStorage:{getItem:k=>{if(brokenStorage)throw Error('Storage blocked');return store.get(k)},setItem:(k,v)=>{if(brokenStorage)throw Error('Storage blocked');store.set(k,v)}},MutationObserver:window.MutationObserver,AbortController,NodeFilter:{SHOW_ELEMENT:1,SHOW_TEXT:4},CustomEvent:window.CustomEvent,setTimeout:schedule,clearTimeout:id=>timers.delete(id),requestAnimationFrame:fn=>schedule(()=>fn(now),1000/60),cancelAnimationFrame:id=>timers.delete(id)});
 const run=s=>vm.runInContext(s,context);for(const file of ['app.js','extra-games.js','new-games.js'])run(fs.readFileSync(__dirname+'/../public/'+file,'utf8'));
 const advance=(ms,observe=()=>{})=>{const target=now+ms;let i=0;while(i++<10000){const next=[...timers].sort((a,b)=>a[1].time-b[1].time)[0];if(!next||next[1].time>target)break;timers.delete(next[0]);now=next[1].time;next[1].fn();observe()}now=target;assert.ok(i<10000,'No runaway timers')};
 const buttons=()=>[...document.querySelectorAll('#board button')],control=text=>[...document.querySelectorAll('#gameControls button,.pool-toolbar button')].find(b=>b.textContent===text);
 return {window,document,run,advance,buttons,control,timers,math,open:id=>run(`open('${id}')`),click:b=>{assert(b&&!b.disabled,'Expected enabled control');b.onclick()},done:()=>run('finished')};
}

module.exports={setup};
