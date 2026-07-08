// EstomaCare — Service Worker
// Estratégia: network-first para garantir que atualizações do app cheguem
// imediatamente aos usuários, evitando telas "presas" em versões antigas.

const CACHE_VERSION = "estomacare-v5"; // ⚠️ Sempre que publicar uma atualização importante, mude este número.
const PRECACHE_URLS = [
  "manifest.json",
  "icon-180.png",
  "icon-192.png",
  "icon-512.png"
];

// Instala e já assume o controle imediatamente (não espera abas antigas fecharem)
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
  );
});

// Ativa e apaga qualquer cache de versões anteriores
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(
        nomes.filter((nome) => nome !== CACHE_VERSION).map((nome) => caches.delete(nome))
      )
    ).then(() => self.clients.claim())
  );
});

// Estratégia de busca:
// - Para o index.html (documento principal): SEMPRE busca da rede primeiro.
//   Isso garante que qualquer atualização publicada no GitHub apareça na hora.
//   Só usa o cache se o dispositivo estiver totalmente offline.
// - Para os demais arquivos estáticos (ícones, manifest): cache primeiro, com atualização em segundo plano.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const isHTML = req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");

  if (isHTML) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(req, resClone));
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
