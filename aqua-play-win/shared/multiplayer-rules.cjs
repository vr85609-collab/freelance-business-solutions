/* One deterministic rules engine for both the room server and offline pass-and-play. */
(function(root){
 'use strict';
 const games={tictac:{rows:3,cols:3},connect:{rows:6,cols:7},reversi:{rows:8,cols:8}};
 function fresh(game){
  if(!Object.hasOwn(games,game))throw Error('Unknown game');
  const {rows,cols}=games[game],cells=Array(rows*cols).fill(0);
  if(game==='reversi'){cells[27]=2;cells[28]=1;cells[35]=1;cells[36]=2;}
  return {game,cells,next:1,winner:null,ply:0,passed:0};
 }
 function flips(cells,index,seat){
  if(!Number.isInteger(index)||index<0||index>=64||cells[index])return [];
  const r=Math.floor(index/8),c=index%8,out=[];
  for(const [dr,dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]){
   let rr=r+dr,cc=c+dc,line=[];
   while(rr>=0&&rr<8&&cc>=0&&cc<8&&cells[rr*8+cc]===3-seat){line.push(rr*8+cc);rr+=dr;cc+=dc;}
   if(line.length&&rr>=0&&rr<8&&cc>=0&&cc<8&&cells[rr*8+cc]===seat)out.push(...line);
  }
  return out;
 }
 function legal(state,seat=state.next){
  if(state.winner!==null)return [];
  if(state.game==='connect')return Array.from({length:7},(_,i)=>i).filter(i=>!state.cells[i]);
  return state.cells.flatMap((v,i)=>!v&&(state.game!=='reversi'||flips(state.cells,i,seat).length)?[i]:[]);
 }
 function play(state,seat,index){
  if(state.winner!==null)throw Error('Match finished');
  if(seat!==state.next)throw Error('Wait for your turn');
  if(!Number.isInteger(index)||!legal(state,seat).includes(index))throw Error('Illegal move');
  const s={...state,cells:[...state.cells],next:3-seat,ply:state.ply+1,passed:0};
  if(s.game==='connect'){let row=5;while(s.cells[row*7+index])row--;index=row*7+index;}
  if(s.game==='reversi')for(const at of flips(s.cells,index,seat))s.cells[at]=seat;
  s.cells[index]=seat;
  if(s.game==='reversi'){
   if(!legal(s,s.next).length){if(legal(s,seat).length){s.passed=s.next;s.next=seat;}else{const a=s.cells.filter(v=>v===1).length,b=s.cells.filter(v=>v===2).length;s.winner=a===b?0:a>b?1:2;}}
  }else{
   const {rows,cols}=games[s.game],need=s.game==='tictac'?3:4;
   for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]]){
    let yes=true;for(let n=0;n<need;n++){const rr=r+dr*n,cc=c+dc*n;if(rr<0||rr>=rows||cc<0||cc>=cols||s.cells[rr*cols+cc]!==seat){yes=false;break;}}
    if(yes)s.winner=seat;
   }
   if(s.winner===null&&s.cells.every(Boolean))s.winner=0;
  }
  return s;
 }
 const api={games,fresh,legal,play};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.AquaVersusRules=api;
})(globalThis);
