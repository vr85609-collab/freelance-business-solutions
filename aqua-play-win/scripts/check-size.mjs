import {readdir,stat} from 'node:fs/promises';
const root=new URL('../android/app/src/main/assets/',import.meta.url);
let total=0;
for(const name of await readdir(root))total+=(await stat(new URL(name,root))).size;
console.log(`Bundled offline content: ${total.toLocaleString('en-US')} bytes (${(total/1024).toFixed(1)} KiB).`);
if(total>600*1024)throw Error('Offline content exceeds the 600 KiB budget. Review added assets before shipping.');
