export async function createHashKey(data: unknown): Promise<string> {
  const msgUint8 = new TextEncoder().encode(JSON.stringify(JSON.stringify(data)))
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hash = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return hash
}

async function openDatabase(storeName: string): Promise<IDBDatabase> {
  return await new Promise((resolve, reject) => {
    const request = indexedDB.open('elephant-cache', 1)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest)?.result
      db.createObjectStore(storeName)
    }

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest)?.result)
    }

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest)?.error as Error)
    }
  })
}

async function get(db: IDBDatabase, objectStore: string, key?: string): Promise<unknown[] | unknown> {
  return await new Promise((resolve, reject) => {
    const store = db
      .transaction(objectStore, 'readonly')
      .objectStore(objectStore)

    const request = key ? store.get(key) : store.getAll()

    request.onsuccess = (event) => {
      resolve((event.target as IDBRequest)?.result)
    }

    request.onerror = (event) => {
      reject((event.target as IDBRequest)?.error as Error)
    }
  })
}

function put(db: IDBDatabase, storeName: string, cacheKey: string, value: unknown): void {
  const store = db
    .transaction(storeName, 'readwrite')
    .objectStore(storeName)

  const request = store.put(value, cacheKey)

  request.onerror = () => {
    console.warn(`Failed caching key ${cacheKey}`)
  }
}

export const IDB = {
  openDatabase,
  get,
  put
}
