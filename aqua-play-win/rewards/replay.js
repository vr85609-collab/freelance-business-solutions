import {Worker} from 'node:worker_threads';
let active=0;
export function verifyReplay(data) {
 if(!Array.isArray(data.events)||data.events.length>4000||active>=4)return Promise.reject(Error('Verification busy or invalid replay'));
 active++;
 return new Promise((resolve,reject)=>{
  const worker=new Worker(new URL('./replay-worker.js',import.meta.url),{workerData:data,resourceLimits:{maxOldGenerationSizeMb:96}});
  const timer=setTimeout(()=>{worker.terminate();reject(Error('Verification timed out'))},8000);
  worker.once('message',resolve);worker.once('error',reject);
  worker.once('exit',code=>{clearTimeout(timer);active--;if(code!==0)reject(Error('Verification stopped'))});
 }).finally(()=>{});
}
