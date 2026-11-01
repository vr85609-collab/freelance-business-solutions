import {readFile,writeFile,readdir} from 'node:fs/promises';
import {minify} from 'terser';
import CleanCSS from 'clean-css';

// Packaging only. Keep global names and game logic intact across classic scripts.
export async function compactAssets(directory) {
 let before=0,after=0;
 for (const name of await readdir(directory)) {
  const path=new URL(name,directory),source=await readFile(path);
  before+=source.length;
  let output=source;
  if(name.endsWith('.js')) {
   const result=await minify(source.toString(),{compress:{toplevel:false,passes:2},mangle:{toplevel:false},keep_fnames:true,format:{comments:false}});
   output=Buffer.from(result.code);
  } else if(name.endsWith('.css')) {
   const result=new CleanCSS({level:1,rebase:false,inline:['none']}).minify(source.toString());
   if(result.errors.length)throw new Error(result.errors.join('\n'));
   output=Buffer.from(result.styles);
  }
  if(output.length<source.length)await writeFile(path,output);else output=source;
  after+=output.length;
 }
 console.log(`Offline asset compaction: ${before} → ${after} bytes. Images unchanged.`);
 return {before,after};
}
