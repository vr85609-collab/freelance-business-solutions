const $=s=>document.querySelector(s);
const board=$('#board'),feedback=$('#feedback'),status=$('#playStatus'),controls=$('#gameControls');
const keys={bubbles:'Bubble Guess',tictac:'Tic-Tac Tactics',memory:'Memory Match',sequence:'Pattern Pulse',lights:'Light Switch',twenty:'Merge 2048',connect:'Connect Four',recall:'Word Recall',focus:'Number Sprint',code:'Codebreaker',slider:'Slide Puzzle',higher:'Higher or Lower'};
const tips={bubbles:'Pick the lucky bubble 10 times. The server checks each guess.',tictac:'You are X. Line up three marks against a clever computer.',memory:'Find all eight pairs in as few flips as you can.',sequence:'Watch the growing color pattern and repeat it in order.',lights:'Tap a square to toggle it and its up/down/left/right neighbors. Switch off all 16.',twenty:'Each arrow moves EVERY tile in that direction. Matching tiles collide and merge. New tiles appear after a successful move. Aim for 2048.',connect:'Connect four tokens in a row before the computer does.',recall:'Memorize five words, then select the ones you saw.',focus:'Find and tap numbers 1 through 16 in order.',code:'Discover the secret 3-digit code in six guesses. Digits can repeat.',slider:'Slide tiles into order from 1 to 8; leave the bottom-right square empty.',higher:'Guess whether the next number is higher or lower. Complete five rounds.'};
const today=()=>new Date().toLocaleDateString('en-CA');
const storeKey='aqua_arcade_v2';
let progress;try{progress=JSON.parse(localStorage.getItem(storeKey)||'{}')}catch{progress={}}
progress={stars:0,finished:0,dates:[],daily:{},...(progress&&typeof progress==='object'?progress:{})};
progress.stars=Number.isFinite(progress.stars)?Math.max(0,progress.stars):0;progress.finished=Number.isFinite(progress.finished)?Math.max(0,progress.finished):0;progress.dates=Array.isArray(progress.dates)?progress.dates:[];progress.daily=progress.daily&&typeof progress.daily==='object'?progress.daily:{};
let game=null,gameState=null,gameId=0,finished=false,dailyMode=false,run=0;
let cleanupTasks=[];
function onCleanup(fn){cleanupTasks.push(fn)}
function leaveGame(){gameId++;run=gameId;for(const fn of cleanupTasks.splice(0))fn()}
function gameTimeout(fn,delay){const token=run;const id=setTimeout(()=>{if(token===run)fn()},delay);onCleanup(()=>clearTimeout(id));return id}
function stopInputs(){document.querySelectorAll('#board button,#board input,#gameControls button,#gameControls select,#gameControls input').forEach(el=>el.disabled=true)}
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const rnd=n=>Math.floor(Math.random()*n);
const clean=()=>{document.querySelector('#mergeMoveExplanation')?.remove();board.removeAttribute('style');board.removeAttribute('aria-label');board.innerHTML='';controls.innerHTML='';feedback.textContent='';status.textContent='';$('#winMessage').classList.add('hidden');board.className='board'};
const btn=(text,fn,parent=controls)=>{let b=document.createElement('button');b.className='action';b.textContent=text;b.onclick=fn;parent.appendChild(b);return b};
function save(){try{localStorage.setItem(storeKey,JSON.stringify(progress))}catch{}$('#stars').textContent=progress.stars;$('#completed').textContent=progress.finished;$('#days').textContent=progress.dates.length;renderDaily()}
function dailyGame(){const date=today();let hash=[...date].reduce((a,c)=>a*31+c.charCodeAt(0),0);return ['memory','tictac','sequence','lights','twenty'][Math.abs(hash)%5]}
function renderDaily(){const d=today(),done=!!progress.daily[d];$('#dailyBadge').textContent=done?'✓ Completed today':'Available today';$('#dailyDescription').textContent=(done?'Nicely done! You can replay whenever you want. ':'Today’s pick: '+keys[dailyGame()]+'. ')+'No penalty for missing a day.';$('#dailyStart').textContent=done?'Play it again':'Try daily challenge'}
function win(stars=5,note='Challenge complete!'){if(finished)return;finished=true;stopInputs();progress.stars+=stars;progress.finished++;if(!progress.dates.includes(today()))progress.dates.push(today());if(dailyMode&&!progress.daily[today()]){progress.daily[today()]=true;progress.stars+=5;note+=' Daily challenge bonus: 5 stars!'}save();feedback.textContent='🎉 '+note+' +'+stars+' stars';btn('Play again',()=>open(game,dailyMode));btn('Explore games',home)}
function makeBoard(c,klass=''){board.className='board '+klass;c.forEach((v,i)=>{let b=document.createElement('button');b.textContent=v;b.dataset.index=i;board.appendChild(b)});return [...board.children]}
function home(){leaveGame();game=null;clean();$('#play').classList.add('hidden');$('#catalog').classList.remove('hidden');document.body.dataset.mode='home'}
function open(name,asDaily=false){if(!keys[name])return;leaveGame();game=name;dailyMode=asDaily;finished=false;clean();$('#play').classList.remove('hidden');$('#catalog').classList.add('hidden');document.body.dataset.mode='playing';document.body.dataset.game=name;$('#gameTitle').textContent=keys[name];$('#genre').textContent=asDaily?'☀️ Daily Challenge':'🎮 Free Play';$('#instructions').textContent=gameHelp[name]?.win||tips[name]||'';updateQuickGuide(name);document.querySelector('#rulesDetails')?.removeAttribute('open');window.AquaCatalog?.record(name);$('#play').scrollIntoView({block:'start',behavior:'instant'});({bubbles,tictac,memory,sequence,lights,twenty,connect,recall,focus,code,slider,higher,...extraGames}[name])()}
document.querySelectorAll('[data-game]').forEach(el=>el.onclick=()=>open(el.dataset.game));
$('#back').onclick=home;$('#restart').onclick=()=>{if(game)open(game,dailyMode)};$('#dailyStart').onclick=()=>open(dailyGame(),true);$('#dailyButton').onclick=()=>open(dailyGame(),true);
async function api(path,obj){let r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(obj)});let v=await r.json();if(!r.ok)throw Error(v.error||'Request failed');return v}
async function bubbles(){
 board.classList.add('bubbles');
 status.textContent='Starting Bubble Guess…';
 const sessionToken=run;
 let offlinePractice=!navigator.onLine,remoteId=null,round=1,wins=0,locked=false,localSecret=rnd(4)+1;
 if(!offlinePractice){
  try{const session=await api('/api/start',{});if(sessionToken!==run)return;remoteId=session.id}
  catch(e){offlinePractice=true}
 }
 if(sessionToken!==run)return;
 const tiles=makeBoard(['🫧 1','🫧 2','🫧 3','🫧 4'],'bubbles');
 const renderStatus=()=>{status.textContent='Round '+round+' / 10 • '+wins+' correct'+(offlinePractice?' • Offline practice':'')};
 renderStatus();
 feedback.textContent=offlinePractice?'Offline practice: guesses and virtual stars stay on this device. No real rewards.':'Select your lucky bubble!';
 tiles.forEach((tile,i)=>tile.onclick=async()=>{
  if(locked||finished||sessionToken!==run)return;
  locked=true;tiles.forEach(x=>x.disabled=true);
  let result;
  try{
   if(!offlinePractice){
    result=await api('/api/guess',{id:remoteId,guess:i+1});
    if(sessionToken!==run)return;
   }else{
    const correct=(i+1)===localSecret;
    wins+=Number(correct);
    result={correct,wins,finished:round===10,round:round+1};
    localSecret=rnd(4)+1;
   }
  }catch(e){
   if(sessionToken!==run)return;
   offlinePractice=true;remoteId=null;round=1;wins=0;localSecret=rnd(4)+1;
   renderStatus();feedback.textContent='Connection lost. Started a NEW offline practice round. Previous server guesses are not transferable.';
   locked=false;tiles.forEach(x=>x.disabled=false);return;
  }
  if(sessionToken!==run)return;
  wins=result.wins;
  feedback.textContent=result.correct?'✨ Correct!':'💦 Not this time';
  if(result.finished){
   status.textContent='Final score: '+wins+'/10'+(offlinePractice?' • Offline practice':'');
   const percentage=wins>=7?15:wins>=4?10:5;
   const reward=$('#winMessage');reward.classList.remove('hidden');
   reward.textContent=(offlinePractice?'Offline practice · ':'')+'Illustrative '+percentage+'% discount (minimum $25). NOT a Shopify coupon or redeemable prize.';
   win(5+wins,'You guessed '+wins+' lucky bubbles.');
   tiles.forEach(x=>x.disabled=true);
  }else{
   round=result.round;renderStatus();tiles.forEach(x=>x.disabled=false);
  }
  locked=false;
 });
}
function tictac(){let a=Array(9).fill(''),over=false;const bs=makeBoard(a,'tictac');function winner(p){const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];return lines.some(l=>l.every(i=>p[i]==='X'))?'X':lines.some(l=>l.every(i=>p[i]==='O'))?'O':p.every(Boolean)?'tie':null}
function minimax(p,turn,depth=0){const w=winner(p);if(w)return {score:w==='O'?10-depth:w==='X'?depth-10:0};let best={score:turn==='O'?-Infinity:Infinity,index:-1};for(let i=0;i<9;i++)if(!p[i]){p[i]=turn;const score=minimax(p,turn==='O'?'X':'O',depth+1).score;p[i]='';if(turn==='O'?score>best.score:score<best.score)best={score,index:i}}return best}
function refresh(){bs.forEach((b,i)=>{b.textContent=a[i]||'·';b.disabled=!!a[i]||over})}
function check(){let w=winner(a);if(!w)return false;over=true;refresh();if(w==='X')win(15,'You outsmarted the computer!');else{finished=true;stopInputs();feedback.textContent=w==='tie'?'A hard-fought draw!':'The computer wins this round. Try another tactic!';btn('Play again',()=>open('tictac'))}return true}
bs.forEach((b,i)=>b.onclick=()=>{if(a[i]||over)return;a[i]='X';refresh();if(check())return;let next=Math.random()<0.72?minimax(a,'O').index:shuffle(a.map((v,i)=>v?-1:i).filter(i=>i>=0))[0];if(next>=0)a[next]='O';refresh();check()});refresh()}
function memory(){let icons=['🌈','🧩','🍀','⭐','🐬','🎈','🚀','💜'],deck=shuffle([...icons,...icons]),revealed=[],matched=new Set(),moves=0,busy=false;const bs=makeBoard(Array(16).fill('❔'),'memory');status.textContent='Pairs found: 0 / 8 • Attempts: 0';bs.forEach((b,i)=>b.onclick=()=>{if(finished||busy||matched.has(i)||revealed.includes(i))return;b.textContent=deck[i];revealed.push(i);if(revealed.length===2){moves++;const [x,y]=revealed;if(deck[x]===deck[y]){matched.add(x);matched.add(y);bs[x].classList.add('matched');bs[y].classList.add('matched');revealed=[];if(matched.size===16)win(Math.max(5,25-Math.max(0,moves-8)),'All eight pairs found in '+moves+' attempts!')}else{busy=true;let token=run;gameTimeout(()=>{if(token!==run)return;bs[x].textContent='❔';bs[y].textContent='❔';revealed=[];busy=false},800)}}status.textContent='Pairs found: '+matched.size/2+' / 8 • Attempts: '+moves})}
function sequence(){status.textContent='Read the rules above first.';feedback.textContent='Ready when you are.';btn('Start pattern challenge',runSequence)}
function runSequence(){const sequenceToken=run;controls.innerHTML='';let pattern=[],pos=0,accept=false,level=0;const colors=['🔴','🔵','🟢','🟡'],bs=makeBoard(colors,'sequence');function next(){if(game!=='sequence')return;accept=false;pos=0;pattern.push(rnd(4));level++;status.textContent='Level '+level+' / 5';feedback.textContent='Watch the pattern...';let token=run;bs.forEach(b=>b.disabled=true);pattern.forEach((n,i)=>{gameTimeout(()=>{if(token!==run)return;bs[n].classList.add('on')},500+i*750);gameTimeout(()=>{if(token!==run)return;bs[n].classList.remove('on');if(i===pattern.length-1){accept=true;bs.forEach(b=>b.disabled=false);feedback.textContent='Your turn: repeat '+pattern.length+' colors'}},900+i*750)})}bs.forEach((b,i)=>b.onclick=()=>{if(!accept)return;if(i!==pattern[pos]){accept=false;finished=true;stopInputs();feedback.textContent='Not quite! Restart and try a new pattern.';btn('Try again',()=>open('sequence'));return}pos++;if(pos===pattern.length){accept=false;bs.forEach(x=>x.disabled=true);if(level>=5)win(20,'You remembered five levels!');else{feedback.textContent='Great memory!';gameTimeout(()=>{if(game==='sequence'&&run===sequenceToken)next()},800)}}});next()}
function lights(){let cells=Array(16).fill(false);const adj=i=>[i,i-4,i+4,...(i%4?[i-1]:[]),...(i%4<3?[i+1]:[])].filter(j=>j>=0&&j<16);function toggle(i){adj(i).forEach(j=>cells[j]=!cells[j])}for(let k=0;k<8;k++)toggle(rnd(16));if(!cells.some(Boolean))toggle(5);let moves=0;const bs=makeBoard(Array(16).fill(''),'lights');function show(){bs.forEach((b,i)=>{b.textContent=cells[i]?'💡':'·';b.classList.toggle('on',cells[i]);b.disabled=finished});status.textContent='Moves: '+moves+' • Lights on: '+cells.filter(Boolean).length}bs.forEach((b,i)=>b.onclick=()=>{if(finished)return;toggle(i);moves++;show();if(!cells.some(Boolean))win(Math.max(5,35-moves),'All lights switched off in '+moves+' moves!')});show()}
function twenty(){
 let a=Array(16).fill(0),score=0,locked=false,moves=0;
 const bs=makeBoard(a,'twenty');
 board.setAttribute('aria-label','2048 game board. Every arrow slides all tiles in that direction.');
 const explanation=document.createElement('p');
 explanation.id='mergeMoveExplanation';
 explanation.style.cssText='font-weight:700;line-height:1.5;text-align:center;margin:10px auto;max-width:440px';
 explanation.setAttribute('aria-live','polite');
 explanation.textContent='Every arrow moves ALL tiles. Matching numbers that collide merge together.';
 board.after(explanation);
 function spawn(){
  const empty=a.map((v,i)=>v?null:i).filter(i=>i!==null);
  if(!empty.length)return -1;
  const at=empty[rnd(empty.length)];
  a[at]=Math.random()<.9?2:4;
  return at;
 }
 spawn();spawn();
 function show(changed=[],newTile=-1){
  bs.forEach((b,i)=>{
   b.textContent=a[i]||'';
   b.dataset.number=a[i];
   b.disabled=true;
   b.title=a[i]?'Tile '+a[i]:'Empty tile';
   b.style.outline=i===newTile?'3px solid #138c7b':changed.includes(i)?'2px solid #8a70db':'';
   b.style.outlineOffset='-3px';
  });
  status.textContent='Score: '+score+' • Largest tile: '+Math.max(...a)+' • Moves: '+moves;
 }
 function process(line){
  const values=line.filter(Boolean),out=[];
  let merges=0;
  for(let i=0;i<values.length;i++){
   if(values[i]===values[i+1]){const combined=values[i]*2;out.push(combined);score+=combined;merges++;i++}
   else out.push(values[i]);
  }
  return {values:[...out,...Array(4-out.length).fill(0)],merges};
 }
 function move(dir){
  if(game!=='twenty'||finished||locked)return;
  const before=[...a];let merged=0;
  for(let r=0;r<4;r++){
   const indices=Array.from({length:4},(_,c)=>dir==='left'||dir==='right'?r*4+c:c*4+r);
   if(dir==='right'||dir==='down')indices.reverse();
   const result=process(indices.map(i=>a[i]));
   merged+=result.merges;
   indices.forEach((i,j)=>a[i]=result.values[j]);
  }
  if(a.every((v,i)=>v===before[i])){
   explanation.textContent='No tiles can move '+dir+'. Try another arrow. Every move affects the whole board.';
   return;
  }
  moves++;
  const moved=a.map((v,i)=>v!==before[i]?i:-1).filter(i=>i>=0);
  const newTile=spawn();
  show(moved,newTile);
  const arrow={up:'↑',down:'↓',left:'←',right:'→'}[dir];
  explanation.textContent='All tiles moved '+arrow+' '+dir+'. '+(merged?merged+' matching pair'+(merged>1?'s':'')+' merged! ':'')+'Purple outlines show changes; the green outline marks the NEW tile.';
  if(a.includes(2048)){win(35,'You merged your way to 2048!');return}
  const can=a.includes(0)||a.some((v,i)=>(i%4<3&&v===a[i+1])||(i<12&&v===a[i+4]));
  if(!can){
   locked=true;
   feedback.textContent='No moves left. Final score: '+score;
   if(score>=256)win(10,'You reached 256+ points before the board filled!');
   else {finished=true;stopInputs();btn('Try again',()=>open('twenty'));}
  }
 }
 const controller=twentyController();onCleanup(()=>controller.abort());
 const touchController=twentyTouchController();onCleanup(()=>touchController.abort());
 btn('↑ Move all tiles UP',()=>move('up'));
 btn('← Move all tiles LEFT',()=>move('left'));
 btn('↓ Move all tiles DOWN',()=>move('down'));
 btn('→ Move all tiles RIGHT',()=>move('right'));
 const handler=e=>{if(game!=='twenty')return;const dir={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'}[e.key];if(dir){e.preventDefault();move(dir)}};
 document.addEventListener('keydown',handler,{signal:controller.signal});
 let touch=null;
 board.addEventListener('touchstart',e=>{touch=[e.touches[0].clientX,e.touches[0].clientY]},{passive:true,signal:touchController.signal});
 board.addEventListener('touchend',e=>{
  if(!touch)return;
  const dx=e.changedTouches[0].clientX-touch[0],dy=e.changedTouches[0].clientY-touch[1];
  touch=null;
  if(Math.max(Math.abs(dx),Math.abs(dy))<25)return;
  move(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'));
 },{passive:true,signal:touchController.signal});
 show();
}
let touchHandlerController;function twentyTouchController(){if(touchHandlerController)touchHandlerController.abort();touchHandlerController=new AbortController();return touchHandlerController}
let keyController;function twentyController(){if(keyController)keyController.abort();keyController=new AbortController();return keyController}
save();home();

/* Second game in each of the six categories. All rewards remain virtual and nonredeemable. */
function connect(){
 const rows=6,cols=7,a=Array(42).fill(''),buttons=makeBoard(Array(7).fill('↓'),'bubbles');
 board.style.maxWidth='530px';board.style.gridTemplateColumns='repeat(7,1fr)';
 const cells=document.createElement('div');cells.className='connect-grid';cells.style.cssText='display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin:12px auto;max-width:530px';
 board.after(cells);
 onCleanup(()=>cells.remove());
 function draw(){buttons.forEach((b,c)=>{b.disabled=over||!!a[c];b.setAttribute('aria-label','Drop token in column '+(c+1))});cells.innerHTML='';a.forEach(v=>{const x=document.createElement('span');x.textContent=v==='P'?'🔵':v==='C'?'🟣':'⚪';x.style.cssText='text-align:center;font-size:clamp(19px,4vw,32px)';cells.appendChild(x)})}
 function drop(c,p){for(let r=rows-1;r>=0;r--){let i=r*cols+c;if(!a[i]){a[i]=p;return i}}return -1}
 function winning(p){let directions=[[0,1],[1,0],[1,1],[1,-1]];for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)for(const [dr,dc] of directions){let yes=true;for(let n=0;n<4;n++){let rr=r+dr*n,cc=c+dc*n;if(rr<0||rr>=rows||cc<0||cc>=cols||a[rr*cols+cc]!==p){yes=false;break}}if(yes)return true}return false}
 let over=false;
 const check=p=>{if(winning(p)){over=true;buttons.forEach(b=>b.disabled=true);if(p==='P')win(20,'Four in a row!');else{finished=true;stopInputs();feedback.textContent='Computer connected four first.';btn('Try again',()=>open('connect'))}return true}if(a.every(Boolean)){over=true;finished=true;stopInputs();feedback.textContent='It is a draw!';btn('Play again',()=>open('connect'));return true}return false};
 function cpu(){if(over||game!=='connect')return;const available=[0,1,2,3,4,5,6].filter(c=>!a[c]);const findWin=p=>available.find(c=>{let i=drop(c,p),w=winning(p);a[i]='';return w});let col=findWin('C')??findWin('P')??[3,2,4,1,5,0,6].find(c=>available.includes(c));drop(col,'C');draw();check('C')}
 buttons.forEach((b,c)=>b.onclick=()=>{if(over||a[c])return;drop(c,'P');draw();if(!check('P'))cpu()});draw();

}
function recall(){status.textContent='Read the rules above first.';feedback.textContent='You will have six seconds to memorize five words.';btn('Show the five words',runRecall)}
function runRecall(){controls.innerHTML='';
 const pool=window.AquaLanguage?.language==='es'?['río','piano','naranja','jardín','cohete','tigre','nube','ventana','planeta','bosque','vela','puente','castillo','botella','océano','acertijo','plata','café','isla','flor']:['river','piano','orange','garden','rocket','tiger','cloud','window','planet','forest','candle','bridge','castle','bottle','ocean','puzzle','silver','coffee','island','flower'];
 const chosen=shuffle(pool).slice(0,5),options=shuffle([...chosen,...shuffle(pool.filter(x=>!chosen.includes(x))).slice(0,5)]);
 const token=run;status.textContent='Memorize these five words:';board.className='board';board.innerHTML='';
 const display=document.createElement('h2');display.style.textAlign='center';display.textContent=chosen.join(' · ');board.appendChild(display);
 feedback.textContent='Words will hide in 6 seconds.';
 gameTimeout(()=>{if(token!==run)return;board.innerHTML='';status.textContent='Select the five words you just saw:';feedback.textContent='0 / 5 selected';let picked=new Set();board.className='board memory';
 options.forEach(word=>{let b=document.createElement('button');b.textContent=word;b.style.fontSize='14px';b.onclick=()=>{if(finished)return;if(picked.has(word)){picked.delete(word);b.classList.remove('on')}else{picked.add(word);b.classList.add('on')}feedback.textContent=picked.size+' / 5 selected';if(picked.size===5){const n=[...picked].filter(w=>chosen.includes(w)).length;if(n===5)win(18,'Perfect word recall!');else{finished=true;stopInputs();feedback.textContent='You remembered '+n+' of 5 words.';btn('Try again',()=>open('recall'));board.querySelectorAll('button').forEach(x=>x.disabled=true)}}};board.appendChild(b)})},6000)
}
function focus(){
 const nums=shuffle(Array.from({length:16},(_,i)=>i+1));let next=1;
 const bs=makeBoard(nums,'lights');status.textContent='Next number: 1';bs.forEach((b,i)=>{b.textContent=nums[i];b.onclick=()=>{if(finished)return;if(nums[i]!==next){feedback.textContent='Find '+next+' first. Follow the numbers in ascending order.';return}feedback.textContent='Great! Keep going.';b.disabled=true;b.classList.add('matched');b.textContent='✓';next++;status.textContent=next<=16?'Next number: '+next:'All found!';if(next===17)win(20,'All numbers found in order!')}})
}
function code(){
 const target=Array.from({length:3},()=>rnd(5));let turn=0;
 status.textContent='Guess 1 / 6';const guesses=document.createElement('div');guesses.style.cssText='margin:16px 0;line-height:1.9';board.appendChild(guesses);
 const fields=Array.from({length:3},()=>{const el=document.createElement('select');el.style.cssText='font-size:22px;padding:12px;margin:5px';for(let d=0;d<=4;d++){let option=document.createElement('option');option.value=d;option.textContent=d;el.appendChild(option)}controls.appendChild(el);return el});
 const submit=btn('Check code',()=>{if(finished||turn>=6)return;const guess=fields.map(el=>Number(el.value)),exact=guess.filter((v,i)=>v===target[i]).length;let freqG=Array(5).fill(0),freqT=Array(5).fill(0);guess.forEach(v=>freqG[v]++);target.forEach(v=>freqT[v]++);const common=freqG.reduce((sum,v,i)=>sum+Math.min(v,freqT[i]),0);turn++;let item=document.createElement('div');item.textContent=guess.join(' - ')+' → '+exact+' exact, '+(common-exact)+' right digit/wrong place';guesses.appendChild(item);status.textContent='Guess '+Math.min(turn+1,6)+' / 6';if(exact===3){submit.disabled=true;win(Math.max(8,25-turn*2),'Code cracked in '+turn+' guesses!')}else if(turn>=6){finished=true;stopInputs();submit.disabled=true;feedback.textContent='The code was '+target.join('-')+'.';btn('Try again',()=>open('code'))}});
 board.className='board';
}
function slider(){
 let a=[1,2,3,4,5,6,7,8,0],previous=-1;
 for(let j=0;j<80;j++){let zero=a.indexOf(0),choices=[zero-3,zero+3,...(zero%3?[zero-1]:[]),...(zero%3<2?[zero+1]:[])].filter(i=>i>=0&&i<9&&i!==previous);let to=choices[rnd(choices.length)];[a[zero],a[to]]=[a[to],a[zero]];previous=zero}
 if(a.every((v,j)=>v===(j+1)%9))[a[7],a[8]]=[a[8],a[7]];
 const bs=makeBoard(a,'tictac');let moves=0;
 function draw(){bs.forEach((b,i)=>{b.textContent=a[i]||' ';b.dataset.number=a[i]||0});status.textContent='Moves: '+moves}
 bs.forEach((b,i)=>b.onclick=()=>{if(finished)return;let z=a.indexOf(0);if(!((Math.abs(z-i)===3)||(Math.floor(z/3)===Math.floor(i/3)&&Math.abs(z-i)===1)))return;[a[z],a[i]]=[a[i],a[z]];moves++;draw();if(a.every((v,j)=>v===(j+1)%9))win(Math.max(7,32-Math.floor(moves/3)),'Tiles solved in '+moves+' moves!')});draw()
}
function higher(){
 let current=rnd(10)+1,turn=1,correct=0;
 board.className='board sequence';const buttons=makeBoard(['⬆️ HIGHER','⬇️ LOWER'],'sequence');
 function draw(){status.textContent='Round '+turn+' / 5 • '+correct+' correct';feedback.textContent='Current number: '+current+' (1–10). What comes next?'}
 let waiting=false;buttons.forEach((b,i)=>b.onclick=()=>{if(finished||waiting)return;waiting=true;buttons.forEach(x=>x.disabled=true);const next=rnd(10)+1;const right=i===0?next>current:next<current;if(right)correct++;feedback.textContent='Next number: '+next+'. '+(right?'✓ Good guess!':'Not quite (ties count as incorrect).');current=next;if(turn>=5){win(5+correct*2,'You guessed '+correct+' out of 5 correctly!');return}turn++;status.textContent='Round '+turn+' / 5 • '+correct+' correct';const token=run;gameTimeout(()=>{if(game!=='higher'||run!==token)return;waiting=false;buttons.forEach(x=>x.disabled=false);draw()},1100)});draw()
}


/* Accessible, game-specific help: instructions, win conditions, and exact demo reward rules.
   Real discounts are disabled. Stars are stored locally and have no monetary value. */
const gameHelp = {
  bubbles:{category:'Luck',rules:'Choose one of four bubbles in each of 10 rounds. The lucky bubble is selected by the game server and changes every round.',win:'Finish all 10 rounds. Each correct selection increases your score.',reward:'Earn 5 stars plus 1 star for each correct guess (5–15 stars total). You will also see a nonredeemable demo discount: 5% for 0–3 correct, 10% for 4–6, or 15% for 7–10. The example discount mentions a $25 minimum purchase.'},
  tictac:{category:'Strategy',rules:'Play as X and take turns with the computer, which plays O. Tap any empty square.',win:'Get three X marks in a horizontal, vertical, or diagonal row before the computer.',reward:'Win: 15 virtual stars. A draw or loss does not award stars.'},
  connect:{category:'Strategy',rules:'Choose a column to drop a blue token. The computer drops purple tokens. Tokens fall to the lowest open position.',win:'Connect four blue tokens horizontally, vertically, or diagonally before the computer.',reward:'Win: 20 virtual stars. Draws and losses do not award stars.'},
  memory:{category:'Memory',rules:'Flip two covered cards at a time. Matching cards stay visible; unmatched cards flip back.',win:'Reveal all eight matching pairs.',reward:'Start at 25 virtual stars for a perfect eight-attempt finish, decreasing by one for each additional attempt to a minimum of 5 stars.'},
  recall:{category:'Memory',rules:'Study five words shown for six seconds. When they disappear, choose the same five words from ten options.',win:'Select all five original words correctly.',reward:'Perfect recall: 18 virtual stars. An incorrect set does not award stars.'},
  sequence:{category:'Concentration',rules:'Watch a sequence of colored buttons light up, then tap the colors in the same order. The sequence grows each round.',win:'Repeat all five levels correctly.',reward:'Complete level five: 20 virtual stars. A wrong sequence ends that attempt without stars.'},
  focus:{category:'Concentration',rules:'Find the numbers 1 through 16 scattered on the board. Tap them in ascending order.',win:'Tap every number in order, from 1 to 16.',reward:'Complete the sequence: 20 virtual stars.'},
  lights:{category:'Logic',rules:'Tap a square to switch that light plus the lights directly above, below, left, and right of it. Each tap flips their on/off states.',win:'Turn off all 16 lights.',reward:'Earn up to 34 virtual stars depending on moves, with a minimum of 5 stars. Fewer moves earn more.'},
  code:{category:'Logic',rules:'Guess a secret three-digit code using digits 0–4; digits may repeat. After each guess, see how many digits are exact and how many match but are in a different position.',win:'Crack the full code in six guesses or fewer.',reward:'Win: 23 stars for a first-try solve, decreasing by 2 stars per additional guess (13 stars at six). No stars if the code is not solved.'},
  twenty:{category:'Planning',rules:'Choose an arrow to move ALL tiles together in that direction. When matching numbers collide, they merge into a larger tile. One new tile appears after a valid move. Purple outlines mark changed squares and green marks the newly added tile.',win:'Create a tile worth 2048. A filled board ends the game if no move is possible.',reward:'Reach 2048: 35 virtual stars. If the board fills without a move, a score of 256 or more earns 10 stars.'},
  slider:{category:'Planning',rules:'Slide a numbered tile into the empty adjacent space. Rearrange the 3 × 3 board.',win:'Arrange the numbers from 1 to 8 in order, with the empty square at the bottom right.',reward:'Earn between 7 and 32 virtual stars depending on your move count. Fewer moves earn more.'},
  higher:{category:'Luck',rules:'You are shown a number from 1 to 10. Predict whether the next number is higher or lower. Repeat for five rounds. Equal numbers count as incorrect.',win:'Complete five predictions and try to maximize correct guesses.',reward:'Earn 5 virtual stars for completing the five rounds, plus 2 additional stars for each correct guess (5–15 stars total).'}
};

/* Illustrated game-specific tutorials: two example frames per game. These
 * diagrams are demonstrations only, not live game outcomes or real rewards. */
const visualExamples={
 bubbles:[
  {cols:4,board:['🫧','🫧','🫧','🫧'],mark:[2],caption:'Step 1: Choose one of four bubbles.'},
  {cols:4,board:['🫧','🫧','✨','🫧'],highlight:[2],caption:'Step 2: A lucky pick earns a point. Play 10 rounds.'}
 ],
 tictac:[
  {cols:3,board:['X','O','·','·','X','O','·','·','·'],mark:[8],caption:'Step 1: You place X; the computer places O. Try to make a line.'},
  {cols:3,board:['X','O','·','·','X','O','·','·','X'],highlight:[0,4,8],caption:'Step 2: Three X marks diagonally wins!'}
 ],
 connect:[
  {cols:4,board:['⚪','⚪','⚪','⚪','⚪','⚪','⚪','⚪','⚪','🟣','⚪','⚪','🔵','🔵','🔵','⚪'],mark:[15],caption:'Step 1: Drop a blue token into a column (zoomed-in example; actual board has 7 columns and 6 rows).'},
  {cols:4,board:['⚪','⚪','⚪','⚪','⚪','⚪','⚪','⚪','⚪','🟣','⚪','⚪','🔵','🔵','🔵','🔵'],highlight:[12,13,14,15],caption:'Step 2: Connect four blue tokens in any direction to win.'}
 ],
 memory:[
  {cols:4,board:['❔','❔','❔','❔','❔','❔','❔','❔'],mark:[0,1],caption:'Step 1: Flip two cards at a time. This is a small example; the actual game has 16 cards.'},
  {cols:4,board:['🐬','🐬','❔','❔','❔','❔','❔','❔'],highlight:[0,1],caption:'Step 2: Matching pairs stay face up. Find all eight pairs.'}
 ],
 recall:[
  {cols:3,board:['river','piano','ocean','forest','star','candle'],highlight:[0,1,2,3,4,5],caption:'Step 1: Read and remember the words shown for six seconds (five words in the actual game).'},
  {cols:3,board:['river','piano','ocean','cat','star','forest'],mark:[0,1,2,4,5],caption:'Step 2: Choose the same five words from ten choices. Incorrect picks end the attempt.'}
 ],
 sequence:[
  {cols:2,board:['🔴','🔵','🟢','🟡'],highlight:[0],caption:'Step 1: Watch which colored button lights up first.'},
  {cols:2,board:['① 🔴','② 🔵','③ 🟢','🟡'],mark:[0,1,2],caption:'Step 2: Tap the colors in that same order. Each level gets longer.'}
 ],
 focus:[
  {cols:4,board:['8','2','15','11','13','1','7','4','10','16','5','3','9','12','14','6'],mark:[5],caption:'Step 1: Find the number 1 among the mixed-up tiles.'},
  {cols:4,board:['8','2','15','11','13','✓','7','4','10','16','5','3','9','12','14','6'],highlight:[5,1],caption:'Step 2: Tap 1, then 2, and keep going until 16.'}
 ],
 lights:[
  {cols:4,board:['💡','·','·','·','💡','💡','·','·','·','💡','·','·','·','·','·','·'],mark:[5],caption:'Step 1: Tap a square to change its light and nearby lights.'},
  {cols:4,board:['💡','💡','·','·','·','·','💡','·','·','·','·','·','·','·','·','·'],highlight:[1,4,5,6,9],caption:'Step 2: Each tap flips a cross-shaped group. Turn every light off.'}
 ],
 code:[
  {cols:3,board:['1','2','3'],mark:[0,1,2],caption:'Step 1: Enter a three-digit guess using digits 0–4.'},
  {cols:3,board:['1','2','4'],highlight:[0,1],caption:'Step 2: Clues tell you exact digits and misplaced digits. Solve in six guesses.'}
 ],
 twenty:[
  {cols:4,board:['2','2','·','·','·','4','·','·','·','·','·','·','·','·','·','·'],mark:[0,1],caption:'Step 1: Swipe or use arrow buttons to move all tiles together.'},
  {cols:4,board:['4','·','·','·','·','4','·','·','·','·','·','·','·','·','·','·'],highlight:[0],caption:'Step 2: Two equal tiles combine. Keep merging until you reach 2048.'}
 ],
 slider:[
  {cols:3,board:['1','2','3','4','·','6','7','5','8'],mark:[7],caption:'Step 1: Tap a numbered tile next to the empty space.'},
  {cols:3,board:['1','2','3','4','5','6','7','·','8'],highlight:[4,7],caption:'Step 2: Slide tiles into number order with the empty space last.'}
 ],
 higher:[
  {cols:3,board:['?','5','?'],mark:[0,2],caption:'Step 1: You see the current number, 5. Predict higher or lower.'},
  {cols:3,board:['⬆️','8','✓'],highlight:[1,2],caption:'Step 2: The new number is 8, so HIGHER was correct. Try five rounds.'}
 ]
};
let visualIndex=0;
function renderVisual(){
 const steps=visualExamples[helpSelected]||[];
 if(!steps.length)return;
 const current=steps[visualIndex],canvas=$('#visualBoard');
 canvas.replaceChildren();
 canvas.style.gridTemplateColumns='repeat('+current.cols+',minmax(0,1fr))';
 current.board.forEach((value,i)=>{
  const cell=document.createElement('div');
  cell.className='visual-cell'+((current.highlight||[]).includes(i)?' highlight':'')+((current.mark||[]).includes(i)?' action-step':'');
  cell.textContent=value;
  canvas.appendChild(cell);
 });
 $('#visualCaption').textContent=current.caption;
 $('#visualStep').textContent='Step '+(visualIndex+1)+' of '+steps.length;
 $('#visualPrev').disabled=visualIndex===0;
 $('#visualNext').disabled=visualIndex===steps.length-1;
}
$('#visualPrev').onclick=()=>{visualIndex=Math.max(0,visualIndex-1);renderVisual()};
$('#visualNext').onclick=()=>{visualIndex=Math.min((visualExamples[helpSelected]||[]).length-1,visualIndex+1);renderVisual()};

let helpSelected = null;
const helpDialog = $('#helpDialog');
function showHelp(id){
  const info=gameHelp[id];if(!info)return;
  helpSelected=id;
  visualIndex=0;
  renderVisual();
  $('#helpHeading').textContent=keys[id];
  $('#helpCategory').textContent=info.category.toUpperCase()+' • GAME GUIDE';
  $('#helpRules').textContent=info.rules;
  $('#helpWin').textContent=info.win;
  $('#helpReward').textContent=info.reward;
  $('#helpNotice').textContent='Virtual stars have no cash value and are saved only in this browser. Completing today’s featured challenge for the first time also adds 5 bonus stars. All Shopify discounts are DEMOS and cannot be redeemed.';
  $('#helpPlay').textContent=game===id?'Continue playing':'Play '+keys[id];
  if(!helpDialog.open)helpDialog.showModal();
}
function closeHelp(){if(helpDialog.open)helpDialog.close()}
$('#helpClose').onclick=closeHelp;
$('#helpDone').onclick=closeHelp;
helpDialog.addEventListener('click',e=>{if(e.target===helpDialog)closeHelp()});
$('#helpPlay').onclick=()=>{const id=helpSelected;closeHelp();if(id&&game!==id)open(id)};
$('#gameInfo').onclick=()=>{if(game)showHelp(game)};
document.querySelectorAll('#catalog .tile[data-game]').forEach(tile=>{
  const holder=document.createElement('div');
  holder.className='tilewrap';
  tile.parentNode.insertBefore(holder,tile);
  holder.appendChild(tile);
  const b=document.createElement('button');
  b.type='button';
  b.className='tile-info';
  b.textContent='ⓘ Info';
  b.setAttribute('aria-label','How to play '+keys[tile.dataset.game]+' and rewards');
  b.onclick=()=>showHelp(tile.dataset.game);
  holder.appendChild(b);
});


/* Inline objective cards and one-tap walkthrough. Always visible during play. */
function updateQuickGuide(id){
 const info=gameHelp[id];if(!info)return;
 $('#quickRules').textContent=info.rules;
 $('#quickWin').textContent=info.win;
 $('#quickReward').textContent=info.reward;
}
$('#quickExample').onclick=()=>{if(game)showHelp(game)};
