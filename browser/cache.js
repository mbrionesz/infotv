// Metadata only: never persist sessions, resolved stream URLs or auth headers.
export function createCache(indexedDB, now = Date.now) {
  let opened;
  function database() {
    if (opened) return opened;
    opened = new Promise(resolve => {
      if (!indexedDB) return resolve(null);
      try {
        const request = indexedDB.open('xuper-tizen-v3', 1);
        request.onupgradeneeded = () => {
          const db = request.result;
          for (const name of ['metadata', 'posters']) if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: 'key' });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = request.onblocked = () => resolve(null);
      } catch (_) { resolve(null); }
    });
    return opened;
  }
  async function get(store, key, stale = false) {
    const db = await database(); if (!db) return null;
    return new Promise(resolve => {
      try {
        const request = db.transaction(store).objectStore(store).get(key);
        request.onsuccess = () => {
          const item = request.result;
          resolve(item && (item.expires > now() || (stale && now() - item.saved < 86400000)) ? item.value : null);
        };
        request.onerror = () => resolve(null);
      } catch (_) { resolve(null); }
    });
  }
  async function put(store, key, value, ttl) {
    const db = await database(); if (!db) return false;
    return new Promise(resolve => {
      try {
        const transaction = db.transaction(store, 'readwrite');
        const bytes=value&&value.size||JSON.stringify(value).length*2;
        transaction.objectStore(store).put({key,value,bytes,saved:now(),expires:now()+ttl});
        transaction.oncomplete = () => resolve(true);
        transaction.onerror = transaction.onabort = () => resolve(false);
      } catch (_) { resolve(false); }
    });
  }
  async function prune(store, maxEntries, maxBytes) {
    const db = await database(); if (!db) return;
    return new Promise(resolve => {
      try {
        const transaction = db.transaction(store, 'readwrite');
        const objectStore = transaction.objectStore(store); const entries = [];
        const request = objectStore.openCursor();
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) { entries.push(cursor.value); cursor.continue(); return; }
          entries.sort((a,b) => b.saved-a.saved);
          let bytes=0;
          entries.forEach((entry,index) => {
            bytes += entry.bytes || entry.value && entry.value.size || 0;
            if (index >= maxEntries || bytes > maxBytes || entry.expires < now()) objectStore.delete(entry.key);
          });
        };
        transaction.oncomplete = transaction.onerror = transaction.onabort = () => resolve();
      } catch (_) { resolve(); }
    });
  }
  return {get,put,prune,available:async()=>!!(await database())};
}
