const V='estomacare-v3';
self.addEventListener('install',e=>{self.skipWaiting();});
self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim())
  );
});
self.addEventListener('fetch',e=>{
  if(!e.request.url.startsWith('http'))return;
  if(e.request.method!=='GET')return;
  e.respondWith(
    fetch(e.request).then(r=>{
      const cl=r.clone();
      caches.open(V).then(c=>c.put(e.request,cl));
      return r;
    }).catch(()=>caches.match(e.request))
  );
});