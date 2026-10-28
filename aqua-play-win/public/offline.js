// Installable PWA and offline status indicator.
(() => {
 const status=document.getElementById('connectionStatus');
 const install=document.getElementById('installButton');
 let deferredPrompt=null;
 const update=()=>{
   const online=navigator.onLine;
   if(status){status.textContent=online?'🟢 Online · Rewards are demos':'📴 Offline practice · No redeemable discounts';status.setAttribute('data-online',String(online));}
 };
 window.addEventListener('online',update);window.addEventListener('offline',update);update();
 if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost')){
   window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(err=>console.warn('Offline setup unavailable:',err)));
 }
 window.addEventListener('beforeinstallprompt',event=>{
   event.preventDefault();deferredPrompt=event;if(install)install.hidden=false;
 });
 if(install)install.addEventListener('click',async()=>{
   if(!deferredPrompt)return;
   deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;install.hidden=true;
 });
 window.addEventListener('appinstalled',()=>{if(install)install.hidden=true});
})();
