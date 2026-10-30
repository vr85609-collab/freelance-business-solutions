import {parentPort,workerData} from 'node:worker_threads';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';
// Only our own checked-in game code executes. Requests contain structured events, never code.
try {
 const {game,seed,language,events}=workerData;
 const {window}=parseHTML(readFileSync(new URL('../public/index.html',import.meta.url),'utf8'));
 const document=window.document; let clock=0,serial=0,state=Number(seed)>>>0;
 const timers=new Map(), math=Object.create(Math);
 math.random=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296};
 const schedule=(fn,ms=0)=>{const id=++serial;timers.set(id,{fn,at:clock+ms});return id};
 window.AquaLanguage={language}; window.HTMLElement.prototype.scrollIntoView=function(){};
 window.HTMLElement.prototype.showModal=function(){this.open=true};window.HTMLElement.prototype.close=function(){this.open=false};
 let earned=null;
 const ctx=vm.createContext({window,document,Math:math,navigator:{onLine:false},
 localStorage:{getItem:()=>null,setItem:()=>{}},MutationObserver:window.MutationObserver,
 AbortController,NodeFilter:{SHOW_ELEMENT:1,SHOW_TEXT:4},CustomEvent:window.CustomEvent,
 setTimeout:schedule,clearTimeout:id=>timers.delete(id),requestAnimationFrame:fn=>schedule(()=>fn(clock),16),cancelAnimationFrame:id=>timers.delete(id),
 recordWin:stars=>{earned=stars}});
 const run=s=>vm.runInContext(s,ctx,{timeout:500});
 for(const file of ['app.js','extra-games.js','new-games.js'])run(readFileSync(new URL('../public/'+file,import.meta.url),'utf8'));
 if(!run('Object.hasOwn(keys,'+JSON.stringify(game)+')')||['bubbles','higher'].includes(game))throw Error('Unsupported reward game');
 run('win=((original)=>(stars,note)=>{if(!finished)recordWin(stars);original(stars,note)})(win)');
 run('open('+JSON.stringify(game)+')');
 for(const event of events){
  if(earned!==null)throw Error('Events after completion');
  if(!Number.isInteger(event.t)||event.t<clock||event.t>1200000)throw Error('Invalid event time');
  let steps=0;
  while(true){const next=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];if(!next||next[1].at>event.t)break;
    if(++steps>3000)throw Error('Timer limit');timers.delete(next[0]);clock=next[1].at;ctx.timerCallback=next[1].fn;run('timerCallback()');}
  clock=event.t;
  if(event.kind==='key'){
   if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.value))throw Error('Invalid key');
   const e=new window.Event('keydown',{bubbles:true});e.key=event.value;document.dispatchEvent(e);continue;
  }
  if(!['board','gameControls'].includes(event.area)||!Number.isInteger(event.index)||event.index<0)throw Error('Invalid target');
  const elements=[...document.querySelectorAll('#'+event.area+' button,#'+event.area+' input,#'+event.area+' select')];
  const el=elements[event.index];if(!el||el.disabled||el.closest('.hidden'))throw Error('Disabled or missing target');
  ctx.target=el;
  if(event.kind==='click')run('target.click()');
  else if(event.kind==='input'){
   if(!['INPUT','SELECT'].includes(el.tagName)||typeof event.value!=='string'||event.value.length>40)throw Error('Invalid input');
   el.value=event.value;el.dispatchEvent(new window.Event('input',{bubbles:true}));el.dispatchEvent(new window.Event('change',{bubbles:true}));
  }else throw Error('Invalid action');
 }
 parentPort.postMessage({won:Number.isFinite(earned)&&earned>0&&(game!=='twenty'||earned===35),virtualStars:earned||0});
}catch {parentPort.postMessage({won:false,error:'The game could not be verified. No reward points were awarded.'});}
