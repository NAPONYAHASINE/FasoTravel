// Minimal IndexedDB helper to store ticket PDFs and ticket metadata for offline access
// Object stores:
// - 'tickets' : { ticketId, blob, savedAt }
// - 'ticket_meta' : { ticket_id, ...ticketFields, savedAt }

import type { Ticket } from './api';

export async function openDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
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

export async function saveTicketBlob(ticketId: string, blob: Blob) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('tickets', 'readwrite');
    const store = tx.objectStore('tickets');
    const putReq = store.put({ ticketId, blob, savedAt: Date.now() });
    putReq.onsuccess = () => resolve();
    putReq.onerror = () => reject(putReq.error);
  });
}

export async function getTicketBlob(ticketId: string): Promise<Blob | null> {
  const db = await openDB();
  return new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction('tickets', 'readonly');
    const store = tx.objectStore('tickets');
    const getReq = store.get(ticketId);
    getReq.onsuccess = () => {
      const result = getReq.result;
      resolve(result ? result.blob as Blob : null);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function getTicketBlobUrl(ticketId: string): Promise<string | null> {
  const blob = await getTicketBlob(ticketId);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

export async function deleteTicketBlob(ticketId: string) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('tickets', 'readwrite');
    const store = tx.objectStore('tickets');
    const delReq = store.delete(ticketId);
    delReq.onsuccess = () => resolve();
    delReq.onerror = () => reject(delReq.error);
  });
}

// -------------------------
// Ticket metadata helpers
// -------------------------

export async function saveTicketMeta(ticket: Ticket) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('ticket_meta', 'readwrite');
    const store = tx.objectStore('ticket_meta');
    const putReq = store.put({ ...ticket, savedAt: Date.now() });
    putReq.onsuccess = () => resolve();
    putReq.onerror = () => reject(putReq.error);
  });
}

export async function getTicketMeta(ticketId: string): Promise<Ticket | null> {
  const db = await openDB();
  return new Promise<Ticket | null>((resolve, reject) => {
    const tx = db.transaction('ticket_meta', 'readonly');
    const store = tx.objectStore('ticket_meta');
    const getReq = store.get(ticketId);
    getReq.onsuccess = () => {
      const result = getReq.result;
      if (!result) return resolve(null);
      // strip savedAt before returning to match API shape
      const { savedAt, ...rest } = result as any;
      resolve(rest as Ticket);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function getAllTicketMeta(): Promise<Ticket[]> {
  const db = await openDB();
  return new Promise<Ticket[]>((resolve, reject) => {
    const tx = db.transaction('ticket_meta', 'readonly');
    const store = tx.objectStore('ticket_meta');
    const req = store.getAll();
    req.onsuccess = () => {
      const items = req.result || [];
      const cleaned = items.map((it: any) => {
        const { savedAt, ...rest } = it;
        return rest as Ticket;
      });
      resolve(cleaned);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteTicketMeta(ticketId: string) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('ticket_meta', 'readwrite');
    const store = tx.objectStore('ticket_meta');
    const delReq = store.delete(ticketId);
    delReq.onsuccess = () => resolve();
    delReq.onerror = () => reject(delReq.error);
  });
}

// -------------------------
// Last-sync helpers (simple localStorage wrapper)
// -------------------------

export function setLastSync(isoTimestamp: string) {
  try {
    localStorage.setItem('tickets_last_sync', isoTimestamp);
  } catch (e) {
    // ignore storage errors
  }
}

export function getLastSync(): string | null {
  try {
    return localStorage.getItem('tickets_last_sync');
  } catch (e) {
    return null;
  }
}

// Purge ticket metadata older than maxAgeDays (default 90 days)
export async function purgeOldTicketMeta(maxAgeDays: number = 30) {
  const db = await openDB();
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  return new Promise<void>((resolve, reject) => {
    try {
      const tx = db.transaction('ticket_meta', 'readwrite');
      const store = tx.objectStore('ticket_meta');
      const cursorReq = store.openCursor();
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (!cursor) {
          resolve();
          return;
        }
        const record = cursor.value;
        if (record && record.savedAt && record.savedAt < cutoff) {
          cursor.delete();
        }
        cursor.continue();
      };
      cursorReq.onerror = () => reject(cursorReq.error);
    } catch (e) {
      reject(e);
    }
  });
}
