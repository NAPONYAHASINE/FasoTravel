// Service Worker: serve ticket PDFs from IndexedDB when offline
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('transportbf_offline', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('tickets')) {
        db.createObjectStore('tickets', { keyPath: 'ticketId' });
      }
      if (!db.objectStoreNames.contains('ticket_meta')) {
        db.createObjectStore('ticket_meta', { keyPath: 'ticket_id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getTicketBlob(ticketId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tickets', 'readonly');
    const store = tx.objectStore('tickets');
    const req = store.get(ticketId);
    req.onsuccess = () => resolve(req.result ? req.result.blob : null);
    req.onerror = () => reject(req.error);
  });
}

async function getAllTicketMeta() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('ticket_meta', 'readonly');
    const store = tx.objectStore('ticket_meta');
    const req = store.getAll();
    req.onsuccess = () => {
      const items = req.result || [];
      // strip savedAt if present
      const cleaned = items.map(it => {
        const copy = Object.assign({}, it);
        delete copy.savedAt;
        return copy;
      });
      resolve(cleaned);
    };
    req.onerror = () => reject(req.error);
  });
}

async function saveTicketMetaBatch(tickets) {
  if (!Array.isArray(tickets)) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('ticket_meta', 'readwrite');
    const store = tx.objectStore('ticket_meta');
    try {
      tickets.forEach(t => {
        const record = Object.assign({}, t, { savedAt: Date.now() });
        store.put(record);
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Transaction failed'));
    } catch (e) {
      reject(e);
    }
  });
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Intercept ticket PDF requests like /tickets/{id}.pdf
  const ticketPdfMatch = url.pathname.match(/\/tickets\/(.+)\.pdf$/);
  if (event.request.method === 'GET' && ticketPdfMatch) {
    const ticketId = ticketPdfMatch[1];
    event.respondWith((async () => {
      try {
        const blob = await getTicketBlob(ticketId);
        if (blob) {
          return new Response(blob, { headers: { 'Content-Type': 'application/pdf' } });
        }
      } catch (err) {
        // ignore and fallback to network
      }
      return fetch(event.request);
    })());
  }
  // Otherwise, let the network handle it

  // Intercept tickets list API requests and serve cached metadata when offline
  // Matches common patterns: /api/.../tickets  OR /tickets  OR /api/users/me/tickets
  const ticketsApiMatch = url.pathname.match(/(^|\/)api(\/.*)?\/tickets$|(^|\/)tickets$|(^|\/)api\/users\/me\/tickets$/i);
  if (event.request.method === 'GET' && ticketsApiMatch) {
    event.respondWith((async () => {
      // Try network first
      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse && networkResponse.ok) {
          // Clone and update cache with fresh metadata (best-effort)
          try {
            const cloned = networkResponse.clone();
            const json = await cloned.json();
            await saveTicketMetaBatch(json);
          } catch (e) {
            // ignore cache write errors
          }
          return networkResponse;
        }
      } catch (e) {
        // network failed, fallthrough to cached
      }

      // Fallback: return cached metadata
      try {
        const cached = await getAllTicketMeta();
        return new Response(JSON.stringify(cached), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err) {
        return new Response(JSON.stringify([]), {
          headers: { 'Content-Type': 'application/json' },
          status: 200
        });
      }
    })());
    return;
  }
});
