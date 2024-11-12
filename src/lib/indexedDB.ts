export async function createHashKey(data: unknown): Promise<string> {
  const msgUint8 = new TextEncoder().encode(JSON.stringify(JSON.stringify(data)))
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hash = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return hash
}

async function open(storeName: string): Promise<IDBDatabase> {
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

async function get(store: IDBObjectStore, key?: string): Promise<unknown[]> {
  return await new Promise((resolve, reject) => {
    const request = key ? store.get(key) : store.getAll()

    request.onsuccess = (event) => {
      resolve((event.target as IDBRequest<unknown[]>).result)
    }

    request.onerror = (event) => {
      reject((event.target as IDBRequest)?.error as Error)
    }
  })
}

async function put(store: IDBObjectStore, cacheKey: string, value: unknown): Promise<boolean> {
  return await new Promise((resolve) => {
    const request = store.put(value, cacheKey)

    request.onerror = () => {
      resolve(false)
    }

    request.onsuccess = () => {
      resolve(true)
    }
  })
}

async function clear(store: IDBObjectStore): Promise<boolean> {
  return await new Promise((resolve) => {
    const request = store.clear()

    request.onerror = () => {
      resolve(false)
    }

    request.onsuccess = () => {
      resolve(true)
    }
  })
}

export const IDB = {
  open,
  get,
  put,
  clear
}
