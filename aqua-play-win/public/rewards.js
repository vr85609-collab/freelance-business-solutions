/* Verified-account rewards. Local practice totals are never submitted or imported. */
(() => {
 const root=document.getElementById('rewardsPanel');if(!root)return;
 const message=document.getElementById('rewardMessage'),account=document.getElementById('rewardAccount'),choices=document.getElementById('rewardChoices'),claims=document.getElementById('rewardClaims');
 let profile=null,config=null,session=null,generation=0,restoreRandom=null;
 const es=()=>window.AquaLanguage?.language==='es';
 const say=(en,spanish=en)=>{message.textContent=es()?spanish:en;const playing=document.getElementById('verifiedGameMessage');if(playing)playing.textContent=message.textContent};
 async function api(path,data){const r=await fetch('/api/rewards/'+path,{credentials:'same-origin',...(data!==undefined?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}:{})});const value=await r.json();if(!r.ok)throw Error(value.error||'Rewards unavailable');return value}
 function button(label,fn,parent){const b=document.createElement('button');b.type='button';b.className='action';b.textContent=label;b.onclick=fn;parent.appendChild(b);return b}
 async function refresh(){
  try{config=await api('status');document.getElementById('rewardSignIn').hidden=!config.accountsReady;document.getElementById('rewardAvailability').textContent=config.enabled?(es()?'Premios activos en línea.':'Online rewards are active.'):(es()?'Canjes desactivados durante la configuración.':'Redemption is disabled while setup is completed.');
   try{profile=await api('me')}catch{profile=null}
   account.replaceChildren();choices.replaceChildren();claims.replaceChildren();
   document.getElementById('rewardSignOut').hidden=!profile;document.getElementById('rewardDelete').hidden=!profile;
   if(!profile){account.textContent=es()?'Inicia sesión para guardar progreso verificado. Tus estrellas de práctica no se convierten en cupones.':'Sign in to save verified progress. Device-only practice stars do not convert into coupons.';return}
   const stats=document.createElement('p');stats.textContent=es()?`${profile.balance} puntos disponibles · ${profile.stars} estrellas verificadas · ${profile.wins} victorias · ${profile.days} días · racha de ${profile.streak} días`:`${profile.balance} available points · ${profile.stars} verified stars · ${profile.wins} wins · ${profile.days} days played · ${profile.streak}-day streak`;account.appendChild(stats);
   for(const reward of profile.rewards){const card=document.createElement('div');card.className='reward';
    const label=document.createElement('p');label.textContent=reward.label+' — '+reward.points+' points / '+reward.wins+' wins / '+reward.days+' days';card.appendChild(label);
    const b=button(reward.approval?(es()?'Solicitar regalo':'Request gift'):(es()?'Canjear cupón':'Redeem coupon'),async()=>{b.disabled=true;try{const result=await api('claim',{rewardId:reward.id});say(result.status==='pending'?'Gift requested. Points are reserved while Victor reviews it. Shipping and tax are not included.':'Your coupon is ready in My claims.');await refresh()}catch(e){say(e.message)}finally{b.disabled=!config.enabled||!reward.eligible}},card);b.disabled=!config.enabled||!reward.eligible;choices.appendChild(card);
   }
   for(const claim of profile.claims){const row=document.createElement('div');row.className='reward';const p=document.createElement('p');p.textContent=claim.reward_id+' · '+claim.status+' · '+claim.id;row.appendChild(p);
    if(claim.status==='issued'){const code=document.createElement('strong');code.textContent=claim.code;row.appendChild(code);const link=document.createElement('a');link.href='https://aquaemoticons.com/discount/'+encodeURIComponent(claim.code);link.textContent=es()?' Usar en la tienda':' Use in store';link.rel='noopener';row.appendChild(link);const expiry=document.createElement('p');expiry.textContent=(es()?'Vence: ':'Expires: ')+new Date(claim.expires_at).toLocaleString();row.appendChild(expiry)}
    else if(['approved','issuing'].includes(claim.status))button(es()?'Recibir / reintentar cupón':'Get / retry code',async()=>{try{await api('claim',{claimId:claim.id});await refresh()}catch(e){say(e.message)}},row);
    claims.appendChild(row);
   }
  }catch{say('Verified rewards are temporarily unavailable. Practice games still work.','Los premios verificados no están disponibles. Puedes practicar.');}
 }
 document.getElementById('rewardRefresh').onclick=refresh;
 document.getElementById('rewardSignOut').onclick=async()=>{await api('logout',{});session=null;await refresh()};
 document.getElementById('rewardDelete').onclick=async()=>{if(!confirm(es()?'¿Eliminar tu cuenta de premios y puntos?':'Delete your rewards account, progress, and unused points?'))return;try{await api('delete',{confirm:'DELETE'});profile=null;await refresh();say('Rewards account deleted. A fraud-prevention hash is retained for 365 days.')}catch(e){say(e.message)}};
 const originalOpen=open,originalWin=win,originalHome=home,originalLeave=leaveGame;
 leaveGame=function(){session=null;if(restoreRandom){Math.random=restoreRandom;restoreRandom=null}return originalLeave()};
 home=function(){generation++;return originalHome()};
 open=async function(name,daily=false){
  const current=++generation;leaveGame();
  if(profile&&config?.accountsReady&&navigator.onLine&&config.verifiedGames.includes(name)){
   try{
    const remote=await api('start',{game:name,language:es()?'es':'en'});if(current!==generation)return;
    let state=remote.seed>>>0;restoreRandom=Math.random;Math.random=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296};
    // originalOpen calls leaveGame. Initialize the RNG after that call's cleanup.
    const cleanup=leaveGame;leaveGame=originalLeave;
    try{originalOpen(name,daily)}finally{leaveGame=cleanup}
    session={id:remote.id,game:name,events:[],start:performance.now()};say('Verified session. A win after at least 20 seconds can earn points. Up to three different games per day.','Sesión verificada. Gana tras 20 segundos para obtener puntos. Hasta tres juegos diferentes por día.');return;
   }catch(e){if(current!==generation)return;say(e.message+' Playing in practice mode.');}
  }
  if(current===generation)originalOpen(name,daily);
 };
 function record(event){if(!session)return;session.events.push({...event,t:Math.round(performance.now()-session.start)});if(session.events.length>4000){session=null;say('This long session is practice only.')}}
 document.addEventListener('click',e=>{const el=e.target.closest?.('button');if(!el||!session)return;const area=el.closest('#board,#gameControls');if(!area)return;record({kind:'click',area:area.id,index:[...area.querySelectorAll('button,input,select')].indexOf(el)})},true);
 document.addEventListener('input',e=>{const el=e.target,area=el.closest?.('#board,#gameControls');if(area&&session)record({kind:'input',area:area.id,index:[...area.querySelectorAll('button,input,select')].indexOf(el),value:el.value})},true);
 document.addEventListener('change',e=>{if(e.target.tagName==='SELECT'){const area=e.target.closest('#board,#gameControls');if(area)record({kind:'input',area:area.id,index:[...area.querySelectorAll('button,input,select')].indexOf(e.target),value:e.target.value})}},true);
 document.addEventListener('keydown',e=>{if(session&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)&&!['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))record({kind:'key',value:e.key})},true);
 let touch=null;
 board.addEventListener('touchstart',e=>{if(session?.game==='twenty')touch=[e.touches[0].clientX,e.touches[0].clientY]},true);
 board.addEventListener('touchend',e=>{if(!touch||session?.game!=='twenty')return;const dx=e.changedTouches[0].clientX-touch[0],dy=e.changedTouches[0].clientY-touch[1];touch=null;if(Math.max(Math.abs(dx),Math.abs(dy))>=25)record({kind:'key',value:Math.abs(dx)>Math.abs(dy)?(dx>0?'ArrowRight':'ArrowLeft'):(dy>0?'ArrowDown':'ArrowUp')})},true);
 win=function(stars,note){const proof=session;const already=finished;originalWin(stars,note);if(already||!proof)return;
  // Let the current input event finish dispatching before freezing its transcript.
  Promise.resolve().then(()=>{if(session===proof)session=null;return api('finish',{id:proof.id,events:proof.events.map(e=>({...e}))})}).then(result=>{say(result.credited?'Verified win: +'+result.earned+' reward points.':result.reason);refresh()}).catch(e=>say(e.message+' Practice stars are still saved.'));
 };
 document.getElementById('languageToggle').addEventListener('click',()=>{session=null;refresh()});
 window.AquaRewards={refresh};refresh();
})();
