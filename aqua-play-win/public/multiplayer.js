/* Private friend rooms online; the same deterministic games work on one phone offline. */
(()=>{
 'use strict';
 const rules=globalThis.AquaVersusRules,panel=document.getElementById('multiplayerPanel');if(!rules||!panel)return;
 const native=document.documentElement.dataset.edition==='android';
 const t=(en,es)=>document.documentElement.lang==='es'?es:en;
 const titles={tictac:['Tic-Tac-Toe','Tres en raya'],connect:['Connect Four','Conecta cuatro'],reversi:['Reversi','Reversi']};
 let active=false,mode=null,state=null,room=null,identity=null,token=0,pollTimer=null,request=null,busy=false,lastBoard='';
 const get=id=>document.getElementById(id),set=(id,text)=>{if(get(id).textContent!==text)get(id).textContent=text;};
 const ui=`<div class="topline"><div><span class="eyebrow" id="mpEyebrow"></span><h2 id="mpHeading"></h2></div><button type="button" class="secondary-button" id="mpBack"></button></div>
 <p id="mpIntro" class="muted"></p><p id="mpError" role="status" aria-live="polite"></p>
 <section id="mpLobby"><div class="mp-games">${Object.entries(titles).map(([id])=>`<button type="button" class="mp-game" data-mp-game="${id}"><svg viewBox="0 0 320 200" aria-hidden="true"><use href="/game-art.svg#${id}"></use></svg><span id="mpName-${id}"></span></button>`).join('')}</div>
 <label class="mp-label" for="mpGame" id="mpChoose"></label><select id="mpGame"><option value="tictac">Tic-Tac-Toe</option><option value="connect">Connect Four</option><option value="reversi">Reversi</option></select>
 <div class="controls mp-actions"><button class="action" type="button" id="mpLocal"></button><button class="action" type="button" id="mpCreate"></button></div>
 <div id="mpJoinArea"><label class="mp-label" for="mpCode" id="mpCodeLabel"></label><div class="controls"><input id="mpCode" maxlength="8" autocapitalize="characters" autocomplete="off" spellcheck="false" inputmode="text" aria-describedby="mpRoomHint"><button class="secondary-button" type="button" id="mpJoin"></button></div></div>
 <p class="fine" id="mpRoomHint"></p><a id="mpBrowser" class="button" href="https://aquaemoticons-play-win.onrender.com/?multiplayer=1" rel="noopener noreferrer"></a><button id="mpResume" class="secondary-button" type="button" hidden></button></section>
 <section id="mpMatch" hidden><div class="mp-room-info"><strong id="mpRoomCode"></strong><button id="mpCopy" class="secondary-button" type="button"></button></div><p id="mpStatus" role="status" aria-live="polite"></p><p id="mpPresence" class="fine"></p><p id="mpGuide" class="muted"></p><div id="mpColumns" class="mp-columns"></div><div id="mpBoard" class="board mp-board"></div><p id="mpScore" class="fine"></p><div class="controls"><button id="mpRematch" class="action" type="button"></button><button id="mpLobbyButton" class="secondary-button" type="button"></button></div></section><p class="fine" id="mpNotice"></p>`;
 panel.innerHTML=ui;
 function labels(){
  set('mpEyebrow',t('PLAY TOGETHER','JUEGUEN JUNTOS'));set('mpHeading',t('Multiplayer','Multijugador'));set('mpBack',t('← All games','← Todos los juegos'));
  set('mpIntro',t('Challenge a friend. Share one device offline, or use a private room online.','Reta a un amigo. Compartan un dispositivo sin conexión o usen una sala privada en línea.'));
  set('mpChoose',t('Choose your game','Elige tu juego'));set('mpLocal',t('Pass & play · 2 players','Pasar y jugar · 2 jugadores'));set('mpCreate',t('Create online room','Crear sala en línea'));
  set('mpCodeLabel',t('Have an invite code?','¿Tienes un código de invitación?'));set('mpJoin',t('Join room','Entrar a la sala'));set('mpCopy',t('Copy invite link','Copiar enlace'));
  set('mpLobbyButton',t('Choose another match','Elegir otra partida'));set('mpResume',t('Return to your online room','Volver a tu sala en línea'));
  set('mpBrowser',t('Play online in your browser ↗','Jugar en línea en el navegador ↗'));
  set('mpRoomHint',native?t('Online friend rooms open in your browser. Pass & play works here without internet.','Las salas con amigos se abren en el navegador. Pasar y jugar funciona aquí sin internet.'):t('Share the eight-character code with one friend. Rooms expire after 30 idle minutes or two hours, and reset if the server restarts.','Comparte el código de ocho caracteres con un amigo. Las salas vencen tras 30 minutos inactivas o dos horas y se borran si el servidor se reinicia.'));
  set('mpNotice',t('Friendly matches only. No stars, coupons or prize credits are awarded.','Partidas amistosas. No otorgan estrellas, cupones ni puntos para premios.'));
  for(const [id,names] of Object.entries(titles)){set('mpName-'+id,t(...names));get('mpGame').querySelector(`[value="${id}"]`).textContent=t(...names);}
  get('mpCreate').hidden=native;get('mpJoinArea').hidden=native;get('mpBrowser').hidden=!native;
  get('mpCode').placeholder=t('8-character code','Código de 8 caracteres');
 }
 function remember(){try{sessionStorage.setItem('aqua_friend_room_v1',JSON.stringify(identity));}catch{}}
 function recover(){try{const value=JSON.parse(sessionStorage.getItem('aqua_friend_room_v1')||'null');if(value&&/^[A-HJ-NP-Z2-9]{8}$/.test(value.code)&&/^[A-Za-z0-9_-]{43}$/.test(value.secret)&&[1,2].includes(value.seat))identity=value;}catch{}get('mpResume').hidden=native||!identity;}
 function cancel(){clearTimeout(pollTimer);pollTimer=null;request?.abort();request=null;token++;busy=false;}
 function error(message){set('mpError',message);}
 function humanError(e){const messages={
  'Room expired or unavailable':['Room expired or unavailable. Create a new room.','La sala venció o no está disponible. Crea una nueva.'],
  'Room already has two players':['This room already has two players.','Esta sala ya tiene dos jugadores.'],
  'Wait for your turn':['Wait for your turn.','Espera tu turno.'],
  'The board changed. Please try your move again':['The board changed. Your move was not submitted; please try again.','El tablero cambió. Tu jugada no se envió; inténtalo de nuevo.']};
  return messages[e.message]?t(...messages[e.message]):t('Connection interrupted or room unavailable. Try again; no move is applied until confirmed.','Conexión interrumpida o sala no disponible. Intenta de nuevo; la jugada solo cuenta cuando se confirma.');
 }
 async function api(path,data,auth=true){
  const controller=new AbortController();request=controller;const timeout=setTimeout(()=>controller.abort(),12000);
  try{const r=await fetch('/api/multiplayer/'+path,{signal:controller.signal,cache:'no-store',headers:{...(data?{'Content-Type':'application/json'}:{}),...(auth&&identity?{Authorization:'Bearer '+identity.secret}:{})},...(data?{method:'POST',body:JSON.stringify(data)}:{})});const body=await r.json();if(!r.ok)throw Error(body.error||'Multiplayer unavailable');return body;}finally{clearTimeout(timeout);if(request===controller)request=null;}
 }
 function lobby(){cancel();get('mpCreate').disabled=false;get('mpJoin').disabled=false;mode=null;room=null;state=null;lastBoard='';get('mpLobby').hidden=false;get('mpMatch').hidden=true;recover();labels();error('');}
 function show(){home();active=true;document.body.dataset.mode='multiplayer';panel.hidden=false;lobby();panel.scrollIntoView({block:'start',behavior:'instant'});}
 function close(){active=false;cancel();panel.hidden=true;}
 function boardMove(move){
  if(busy||state?.winner!==null)return;
  if(mode==='local'){try{state=rules.play(state,state.next,move);render();}catch{}return;}
  if(mode==='online'&&room?.joined&&state.next===identity.seat)act('move',move);
 }
 function render(){
  if(!state)return;labels();get('mpLobby').hidden=true;get('mpMatch').hidden=false;
  const title=t(...titles[state.game]),your=mode==='online'?identity.seat:null;
  set('mpRoomCode',mode==='online'?t('Room ','Sala ')+room.code:title+' · '+t('Pass & play','Pasar y jugar'));
  get('mpCopy').hidden=mode!=='online';
  let status=state.winner===0?t('Draw!','¡Empate!'):state.winner?t('Player '+state.winner+' wins!','¡Gana el jugador '+state.winner+'!'):mode==='online'&&!room.joined?t('Waiting for your friend to join…','Esperando a tu amigo…'):t('Player '+state.next+'’s turn','Turno del jugador '+state.next);
  if(your)status+=' · '+t('You are player '+your,'Eres el jugador '+your);
  if(state.passed)status+=' · '+t('Player '+state.passed+' has no legal move and passes.','El jugador '+state.passed+' no tiene jugada válida y pasa.');set('mpStatus',status);
  set('mpPresence',mode==='online'?(room.joined?(room.online[2-your]?t('Your friend is connected.','Tu amigo está conectado.'):t('Your friend may be disconnected. Keep this tab open to resume.','Tu amigo puede estar desconectado. Mantén esta pestaña abierta para continuar.')):t('Share your code or invite link. Both players need internet.','Comparte tu código o enlace. Ambos jugadores necesitan internet.')):t('Hand the device to the other player after each turn.','Pasa el dispositivo al otro jugador después de cada turno.'));
  const guide=state.game==='tictac'?['X is player 1; O is player 2. Make a line of three.','X es el jugador 1; O es el jugador 2. Forma una línea de tres.']:state.game==='connect'?['Choose a column. Player 1 is gold; player 2 is blue. Connect four discs.','Elige una columna. El jugador 1 es dorado; el jugador 2 es azul. Conecta cuatro fichas.']:['Player 1 is gold; player 2 is blue. Tap a dotted square to capture a line of opposing discs. Most discs wins. A player with no legal move passes automatically.','El jugador 1 es dorado; el jugador 2 es azul. Toca una casilla con punto para capturar fichas rivales. Gana quien tenga más fichas. Sin jugadas válidas, se pasa automáticamente.'];set('mpGuide',t(...guide));
  set('mpScore',t('Moves: ','Jugadas: ')+state.ply+(state.game==='reversi'?' · '+t('Discs','Fichas')+': '+state.cells.filter(v=>v===1).length+' / '+state.cells.filter(v=>v===2).length:''));
  get('mpRematch').hidden=state.winner===null;get('mpRematch').disabled=busy||(mode==='online'&&room.rematch[your-1]);set('mpRematch',mode==='online'&&room.rematch[your-1]?t('Waiting for rematch approval…','Esperando aprobación para revancha…'):t('Play again','Jugar otra vez'));
  const can=state.winner===null&&!busy&&(mode==='local'||(room.joined&&state.next===your));
  const fingerprint=JSON.stringify([state,can,document.documentElement.lang]);if(fingerprint===lastBoard)return;lastBoard=fingerprint;
  const board=get('mpBoard'),columns=get('mpColumns');board.replaceChildren();columns.replaceChildren();board.className='board mp-board mp-'+state.game;board.style.gridTemplateColumns='repeat('+rules.games[state.game].cols+',minmax(0,1fr))';columns.hidden=state.game!=='connect';
  const legal=rules.legal(state);if(state.game==='connect')for(let col=0;col<7;col++){const b=document.createElement('button');b.type='button';b.textContent='↓ '+(col+1);b.setAttribute('aria-label',t('Drop in column ','Soltar en columna ')+(col+1));b.disabled=!can||!legal.includes(col);b.onclick=()=>boardMove(col);columns.appendChild(b);}
  state.cells.forEach((seat,i)=>{const b=document.createElement(state.game==='connect'?'span':'button');if(b.tagName==='BUTTON')b.type='button';b.className='mp-cell';b.dataset.seat=seat;b.textContent=seat?(state.game==='tictac'?(seat===1?'X':'O'):'●'):(state.game==='reversi'&&legal.includes(i)?'·':'');b.setAttribute('aria-label',t('Square ','Casilla ')+(i+1)+': '+(seat?t('player ','jugador ')+seat:t('empty','vacía')));if(b.tagName==='BUTTON'){b.disabled=!can||!legal.includes(i);b.onclick=()=>boardMove(i);}board.appendChild(b);});
 }
 function schedule(){clearTimeout(pollTimer);if(active&&mode==='online'&&!document.hidden)pollTimer=setTimeout(poll,2000);}
 async function poll(){
  if(!active||mode!=='online'||document.hidden)return;
  if(busy){schedule();return;}
  const generation=token;busy=true;
  try{const data=await api('rooms/'+identity.code);if(generation!==token)return;room=data.room;state=room.state;error('');}
  catch(e){if(generation===token)error(humanError(e));}
  finally{if(generation===token){busy=false;render();schedule();}}
 }
 function startOnline(data){identity={code:data.room.code,secret:data.token,seat:data.seat};remember();mode='online';room=data.room;state=room.state;lastBoard='';render();panel.scrollIntoView({block:'start',behavior:'instant'});schedule();}
 async function connect(join=false){
  if(busy||native)return;const generation=token;busy=true;get('mpCreate').disabled=true;get('mpJoin').disabled=true;error(t('Connecting…','Conectando…'));
  try{const code=get('mpCode').value.trim().toUpperCase();if(join&&!/^[A-HJ-NP-Z2-9]{8}$/.test(code))throw Error('Room expired or unavailable');const data=await api(join?'rooms/'+code+'/join':'rooms',join?{}:{game:get('mpGame').value},false);if(generation===token){error('');startOnline(data);}}
  catch(e){if(generation===token)error(humanError(e));}
  finally{if(generation===token){busy=false;get('mpCreate').disabled=false;get('mpJoin').disabled=false;if(state)render();}}
 }
 async function act(kind,move){
  if(busy)return;const generation=token;busy=true;clearTimeout(pollTimer);render();
  try{const id=crypto.randomUUID?crypto.randomUUID():Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');const data=await api('rooms/'+identity.code+'/actions',{kind,move,revision:room.revision,requestId:id});if(generation===token){room=data.room;state=room.state;error('');}}
  catch(e){if(generation===token)error(humanError(e));}
  finally{if(generation===token){busy=false;render();schedule();}}
 }
 get('mpBack').onclick=()=>home();get('mpLobbyButton').onclick=lobby;
 get('mpLocal').onclick=()=>{cancel();mode='local';state=rules.fresh(get('mpGame').value);lastBoard='';error('');render();panel.scrollIntoView({block:'start',behavior:'instant'});};
 get('mpCreate').onclick=()=>connect(false);get('mpJoin').onclick=()=>connect(true);
 get('mpCode').addEventListener('keydown',e=>{if(e.key==='Enter')connect(true);});
 panel.querySelectorAll('[data-mp-game]').forEach(b=>b.onclick=()=>{get('mpGame').value=b.dataset.mpGame;get('mpLocal').focus();});
 get('mpResume').onclick=()=>{if(identity){cancel();mode='online';poll();}};
 get('mpRematch').onclick=()=>{if(mode==='local'){state=rules.fresh(state.game);lastBoard='';render();}else act('rematch');};
 get('mpCopy').onclick=async()=>{const link=location.origin+'/?multiplayer=1&room='+room.code;try{await navigator.clipboard.writeText(link);error(t('Invite link copied.','Enlace copiado.'));}catch{error(t('Share room code: ','Comparte el código: ')+room.code);}};
 document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(pollTimer);pollTimer=null;}else if(active&&mode==='online')poll();});
 window.addEventListener('aqua-language-changed',()=>{labels();if(state)render();});
 window.AquaMultiplayer={show,close};labels();recover();
 const params=new URLSearchParams(location.search);if(params.get('multiplayer')==='1'){show();get('mpCode').value=params.get('room')||'';}
})();
