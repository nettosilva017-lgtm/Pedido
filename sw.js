// Service Worker - Ouxe Distribuidor
const CACHE_NAME = 'ouxe-app-v1.0';
const OFFLINE_URL = './index.html';

// Arquivos essenciais para cache inicial
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './ouxe-logo.jpg'
];

// ============================================
// INSTALL - Cacheia arquivos estáticos
// ============================================
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache aberto:', CACHE_NAME);
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Arquivos cacheados com sucesso');
        return self.skipWaiting(); // Ativa imediatamente
      })
      .catch((err) => {
        console.error('[SW] Erro ao cachear arquivos:', err);
      })
  );
});

// ============================================
// ACTIVATE - Limpa caches antigos
// ============================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log('[SW] Deletando cache antigo:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker ativado');
        return self.clients.claim(); // Controla todas as abas imediatamente
      })
  );
});

// ============================================
// FETCH - Estratégia: Cache First, Network Fallback
// ============================================
self.addEventListener('fetch', (event) => {
  // Ignora requisições de outros domínios (CDN, APIs externas)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Ignora requisições que não são GET
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Se tem no cache, retorna do cache
        if (cachedResponse) {
          // Atualiza o cache em background (stale-while-revalidate)
          const fetchPromise = fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, responseClone);
                });
              }
              return networkResponse;
            })
            .catch(() => {
              // Silencioso - mantém o cache existente
            });
          
          return cachedResponse;
        }

        // Se não tem no cache, busca da rede
        return fetch(event.request)
          .then((response) => {
            // Se a resposta é válida, cacheia
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseClone);
              });

            return response;
          })
          .catch(() => {
            // Fallback para offline - retorna index.html
            return caches.match(OFFLINE_URL);
          });
      })
  );
});

// ============================================
// MESSAGE - Comunicação com a página principal
// ============================================
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    });
  }
});