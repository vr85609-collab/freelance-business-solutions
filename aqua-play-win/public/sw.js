const CACHE='aqua-arcade-offline-v2';
const ASSETS=['/','/index.html','/app.js','/theme.js','/language.js','/offline.js','/manifest.webmanifest','/icon.svg'];
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
  if(url.pathname.startsWith('/api/'))return; // Never cache gameplay or future reward API calls.
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).then(response=>{
      if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(c=>c.put('/index.html',copy)));}
      return response;
    }).catch(async()=>await caches.match('/index.html')||await caches.match('/')));
    return;
  }
  if(ASSETS.includes(url.pathname)){
    event.respondWith(caches.match(url.pathname).then(cached=>{
      const fresh=fetch(request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(c=>c.put(url.pathname,copy)));}return response}).catch(()=>cached);
      return cached||fresh;
    }));
  }
});
