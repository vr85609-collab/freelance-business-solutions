const CACHE='aqua-arcade-offline-v9';
const ASSETS=['/','/index.html','/app.js','/extra-games.js','/new-games.js','/catalog.js','/arcade.css','/theme.js','/language.js','/offline.js','/manifest.webmanifest','/icon.svg','/brand-logo.png','/rewards.js'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([
    caches.keys().then(names=>Promise.all(names.filter(n=>n.startsWith('aqua-arcade-')&&n!==CACHE).map(n=>caches.delete(n)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  if(url.pathname.startsWith('/api/')||url.pathname.startsWith('/auth/')||['/rewards-admin','/privacy','/rewards-terms','/delete-account'].includes(url.pathname))return; // Never cache gameplay or future reward API calls.
  // Serve one fully installed release so HTML and game scripts cannot mix versions.
  if(request.mode==='navigate'){
    event.respondWith(caches.open(CACHE).then(async cache=>
      await cache.match('/index.html')||await fetch(request)));
    return;
  }
  if(ASSETS.includes(url.pathname)){
    event.respondWith(caches.open(CACHE).then(async cache=>
      await cache.match(url.pathname)||await fetch(request)));
  }
});
