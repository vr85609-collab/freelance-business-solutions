/* Small, offline presentation layer. No downloaded audio, engine, or animation loop. */
(()=>{
 'use strict';
 const root=document.documentElement,key='aqua_experience_v1';
 let saved={};try{saved=JSON.parse(localStorage.getItem(key)||'{}')||{}}catch{}
 let light=typeof saved.light==='boolean'?saved.light:!!((navigator.deviceMemory&&navigator.deviceMemory<=4)||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=4));
 let sound=saved.sound===true,audio=null,lastTone=0;
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 const animations=new Map();
 const effectsButton=document.getElementById('effectsToggle'),soundButton=document.getElementById('soundToggle');
 const spanish=()=>root.lang==='es';
 function save(){try{localStorage.setItem(key,JSON.stringify({light,sound}))}catch{}}
 function render(){
  root.dataset.effects=light?'light':'full';
  effectsButton.setAttribute('aria-pressed',String(light));soundButton.setAttribute('aria-pressed',String(sound));
  // This layer follows language changes without adding another text observer.
  effectsButton.textContent=spanish()?`Efectos ligeros: ${light?'sí':'no'}`:`Light effects: ${light?'on':'off'}`;
  soundButton.textContent=spanish()?`Sonido: ${sound?'sí':'no'}`:`Sound: ${sound?'on':'off'}`;
  document.getElementById('settingsHeading').textContent=spanish()?'Ajustes de juego':'Play settings';
  document.getElementById('settingsHint').textContent=spanish()?'Los efectos ligeros reducen movimiento y sombras. El sonido es opcional.':'Light effects reduce motion and shadows. Sound is optional.';
 }
 function stop(){for(const a of animations.values())a.cancel();animations.clear()}
 function animate(el,frames,duration=160){
  if(light||reduced?.matches||document.hidden||!el?.animate)return;
  animations.get(el)?.cancel();
  const a=el.animate(frames,{duration,easing:'cubic-bezier(.2,.75,.25,1)'});animations.set(el,a);
  const release=()=>{if(animations.get(el)===a)animations.delete(el)};a.onfinish=release;a.oncancel=release;
 }
 function tone(win=false){
  if(!sound||document.hidden)return;
  const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
  try{
   audio??=new Audio();if(audio.state==='suspended')audio.resume().catch(()=>{});
   const now=audio.currentTime;if(!win&&now-lastTone<.055)return;lastTone=now;
   const notes=win?[523.25,659.25,783.99]:[440];
   notes.forEach((hz,i)=>{const start=now+i*.09,osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.value=hz;gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.035,start+.008);gain.gain.exponentialRampToValueAtTime(.0001,start+.085);osc.connect(gain);gain.connect(audio.destination);osc.onended=()=>{osc.disconnect();gain.disconnect()};osc.start(start);osc.stop(start+.09)});
  }catch{/* Sound is optional; unavailable audio never interrupts a game. */}
 }
 effectsButton.onclick=()=>{light=!light;stop();save();render()};
 soundButton.onclick=()=>{sound=!sound;save();render();if(sound)tone();else audio?.suspend().catch(()=>{})};
 document.addEventListener('click',e=>{if(e.target.closest?.('#board button:not(:disabled),#gameControls button:not(:disabled)'))tone()},{capture:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();audio?.suspend().catch(()=>{})}});
 window.addEventListener('pagehide',()=>{stop();audio?.suspend().catch(()=>{})});
 window.addEventListener('aqua-language-changed',render);
 reduced?.addEventListener?.('change',()=>{if(reduced.matches)stop()});
 window.AquaExperience={
  stop,
  moveTiles(tiles,paths,newTile){
   if(light||reduced?.matches)return;
   // Cancel earlier motion so fast inputs read stable layout, then reuse the cells.
   stop();
   const rects=tiles.map(el=>el.getBoundingClientRect());
   for(const {to,from,merged} of paths){
    if(from===to&&!merged)continue;
    const dx=rects[from].left-rects[to].left,dy=rects[from].top-rects[to].top;
    animate(tiles[to],[{transform:`translate(${dx}px,${dy}px) scale(.95)`,opacity:.65},{transform:merged?'scale(1.08)':'none',opacity:1,offset:.8},{transform:'none',opacity:1}],180);
   }
   animate(tiles[newTile],[{transform:'scale(.4)',opacity:.1},{transform:'none',opacity:1}],180);
  },
  celebrate(){tone(true);animate(document.getElementById('feedback'),[{transform:'translateY(6px)',opacity:.4},{transform:'none',opacity:1}],260)}
 };
 render();
})();
