const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync,spawnSync}=require('node:child_process');
const {setup}=require('./helpers.cjs');
const assets='android/app/src/main/assets',root=path.resolve(__dirname,'..');
test('Compacted Android scripts preserve all game engines, help, timer cleanup and awards',()=>{
 const g=setup({assetsDirectory:assets});
 for(const id of g.run('Object.keys(keys)')){g.open(id);g.run(`showHelp('${id}');closeHelp();home()`);g.advance(30000);assert.equal(g.timers.size,0,id+' releases timers');}
 g.open('focus');for(let n=1;n<=16;n++)g.click(g.buttons().find(b=>b.textContent===String(n)));assert(g.done());assert.equal(g.run('progress.stars'),20);
 g.open('twenty');const initial=g.document.querySelector('#playStatus').textContent;g.click(g.control('← Move all tiles LEFT'));assert.notEqual(g.document.querySelector('#playStatus').textContent,initial);
});
test('Compaction keeps every raster image byte-for-byte and preserves shared game symbols',()=>{
 const target=path.join(root,assets);for(const name of fs.readdirSync(target).filter(n=>/\.(png|webp)$/.test(n)))assert.deepEqual(fs.readFileSync(path.join(target,name)),fs.readFileSync(path.join(root,'public',name)),name);
 const art=fs.readFileSync(path.join(target,'game-art.svg'),'utf8');const g=setup();for(const id of g.run('Object.keys(keys)'))assert(art.includes('id="'+id+'"'),id);
});
test('Framework offline loader accepts packaged files and rejects foreign origins, traversal and writes',{skip:spawnSync('javac',['-version']).status!==0&&!process.env.CI},()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'arcade-policy-'));try{
 const source=`package com.aquaemoticons.arcade;
 public class PolicyCheck {
 static void check(boolean b){if(!b)throw new AssertionError("offline origin policy");}
 public static void main(String[] args){
 String host="appassets.androidplatform.net";
 check("index.html".equals(OfflineAssets.resolve("https",host,-1,"GET","/index.html")));
 check("game-art.svg".equals(OfflineAssets.resolve("https",host,443,"GET","/game-art.svg")));
 for(String path:new String[]{"/../index.html","/%2e%2e/index.html","//index.html","/index.html%00","/secret.txt","/rewards.js","/api/rewards/login","/assets/index.html"})check(OfflineAssets.resolve("https",host,-1,"GET",path)==null);
 check(OfflineAssets.resolve("http",host,-1,"GET","/index.html")==null);
 check(OfflineAssets.resolve("file",host,-1,"GET","/index.html")==null);
 check(OfflineAssets.resolve("https",host+".evil.test",-1,"GET","/index.html")==null);
 check(OfflineAssets.resolve("https",host,8080,"GET","/index.html")==null);
 check(OfflineAssets.resolve("https",host,-1,"POST","/index.html")==null);
 check("image/webp".equals(OfflineAssets.mime("ocean-hero.webp")));
 check(!OfflineAssets.isText("ocean-hero.webp"));check(OfflineAssets.isText("arcade.css"));
 System.out.println("Offline origin policy passed");}}`;
 fs.writeFileSync(path.join(tmp,'PolicyCheck.java'),source);execFileSync('javac',['-d',tmp,path.join(root,'android/app/src/main/java/com/aquaemoticons/arcade/OfflineAssets.java'),path.join(tmp,'PolicyCheck.java')]);assert.match(execFileSync('java',['-cp',tmp,'com.aquaemoticons.arcade.PolicyCheck'],{encoding:'utf8'}),/passed/);
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
