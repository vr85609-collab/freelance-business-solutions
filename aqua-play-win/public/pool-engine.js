/* Fixed-step pool simulation, independent of rendering and display refresh rate. */
(function(root){
 const R=9,STEP=1/120,POCKETS=[[24,24],[320,18],[616,24],[24,316],[320,322],[616,316]];
 class PoolEngine {
  constructor(){this.balls=[{x:155,y:170,vx:0,vy:0,cue:true,color:'#ffffff'},...Array.from({length:6},(_,i)=>({x:420+Math.floor(i/3)*26,y:144+(i%3)*26,vx:0,vy:0,number:i+1,color:['#f9c846','#e84c4c','#70bcff','#ba7bff','#ff9752','#9fe170'][i]}))];this.shots=0;this.moving=false;this.scratch=false;this.elapsed=0;this.accumulator=0;this.result=null;this.lastScratch=false;}
  get pocketed(){return this.balls.slice(1).filter(b=>b.out).length}
  shoot(angle,power){if(this.moving||this.result||!Number.isFinite(angle)||!Number.isFinite(power))return false;this.shots++;this.moving=true;this.scratch=false;this.lastScratch=false;this.elapsed=0;const speed=240+Math.max(0,Math.min(100,power))*6;Object.assign(this.balls[0],{vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed});return true}
  advance(seconds){if(!this.moving)return;this.accumulator+=Math.max(0,Math.min(.1,seconds));while(this.accumulator>=STEP&&this.moving){this.accumulator-=STEP;this.step();}}
  step(){
   this.elapsed+=STEP;
   for(const b of this.balls){if(b.out)continue;b.x+=b.vx*STEP;b.y+=b.vy*STEP;const drag=Math.exp(-1.05*STEP);b.vx*=drag;b.vy*=drag;
    if(POCKETS.some(([x,y])=>Math.hypot(b.x-x,b.y-y)<21)){b.out=true;b.vx=b.vy=0;if(b.cue)this.scratch=true;continue}
    if(b.x<29){b.x=29;b.vx=Math.abs(b.vx)*.88}if(b.x>611){b.x=611;b.vx=-Math.abs(b.vx)*.88}if(b.y<29){b.y=29;b.vy=Math.abs(b.vy)*.88}if(b.y>311){b.y=311;b.vy=-Math.abs(b.vy)*.88}
   }
   for(let i=0;i<this.balls.length;i++)for(let j=i+1;j<this.balls.length;j++){const a=this.balls[i],b=this.balls[j];if(a.out||b.out)continue;let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<2*R){const nx=d?dx/d:1,ny=d?dy/d:0,over=(2*R-d)/2+.001;a.x-=nx*over;a.y-=ny*over;b.x+=nx*over;b.y+=ny*over;const speed=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;if(speed>0){const impulse=speed*.97;a.vx-=impulse*nx;a.vy-=impulse*ny;b.vx+=impulse*nx;b.vy+=impulse*ny;}}}
   if(this.elapsed>=12||this.balls.every(b=>b.out||Math.hypot(b.vx,b.vy)<7))this.settle();
  }
  settle(){this.moving=false;this.accumulator=0;this.balls.forEach(b=>{b.vx=b.vy=0});if(this.scratch){this.shots++;this.lastScratch=true;const cue=this.balls[0];let spot=null;for(let y=170;y<=290&&!spot;y+=24)for(let x=155;x<=590&&!spot;x+=24)if(this.balls.slice(1).every(b=>b.out||Math.hypot(b.x-x,b.y-y)>2*R+2))spot={x,y};Object.assign(cue,spot||{x:65,y:65},{out:false});}
   if(this.pocketed===6&&this.shots<=20)this.result='win';else if(this.shots>=20)this.result='loss';
  }
 }
 root.PoolEngine=PoolEngine;root.PoolGeometry={radius:R,pockets:POCKETS};
})(typeof window!=='undefined'?window:globalThis);
