
export class IndexedDBConnection {
  readonly #name: string = ''
  readonly #version: number = 1
  #db: IDBDatabase | null = null
  #onVersionChange: (() => void) | null = null
  #onUpgradeNeeded: ((db: IDBDatabase, version: number) => void) | null = null

  constructor(storeName: string, version: number) {
    this.#name = storeName
    this.#version = version
  }

  async open(): Promise<IDBDatabase | null> {
    if (this.#db) {
      console.warn(`IndexedDb ${this.#name} version ${this.#version} is already opened`)
      return this.#db
    }

    // We need to know the current version to know from where we want to migrate.
    // If we get version 1 we assume the database needs to be initalized.
    // This means version 2 is the first real version!
    const fromMigration = await this.#getVersion() - 1

    const requestPromise = new Promise<IDBDatabase | null>((resolve) => {
      const request = indexedDB.open(this.#name, this.#version + 1)

      request.onupgradeneeded = () => {
        if (typeof this.#onUpgradeNeeded === 'function') {
          this.#onUpgradeNeeded(request.result, fromMigration)
        } else {
          throw new Error(`No IndexedDB upgrade callback provideed to upgrade ${this.#name} to version ${this.#version}`)
        }
      }

      request.onsuccess = () => {
        console.info('Successfully opened IndexedDB')
        resolve(request.result)
      }

      request.onerror = () => {
        console.error(request.error?.message || `Failed opening ${this.#name} v${this.#version}`)
        resolve(null)
      }
    })

    const db = await requestPromise
    if (!db) {
      return null
    }

    db.onversionchange = () => {
      console.info(`Version change detected, closing IndexedDB ${this.#name} version ${this.#version}`)

      // Immediately close db connection to allow another tab to upgrade
      db.close()
      this.#db = null
      this.#onVersionChange?.()
    }

    this.#db = db
    return this.#db
  }

  get name(): string {
    return this.#name
  }

  get version(): number {
    return this.#version
  }

  set onUpgradeNeeded(cb: (db: IDBDatabase, currentVersion: number) => void) {
    this.#onUpgradeNeeded = cb
  }

  set onVersionChange(cb: () => void) {
    this.#onVersionChange = cb
  }

  /**
   * Open IndexedDB database without specifying version to get be able to get current version.
   */
  #getVersion(): Promise<number> {
    return new Promise((resolve) => {
      const request = indexedDB.open(this.#name)

      request.onsuccess = () => {
        const db = request.result
        const version = db.version
        db.close()
        resolve(version)
      }

      request.onerror = () => {
        throw new Error(request.error?.message || `Failed checking version of ${this.#name}, unrecoverable error`)
      }
    })
  }
}


// async function get(store: IDBObjectStore, key?: string): Promise<unknown[]> {
//   return await new Promise((resolve, reject) => {
//     const request = key ? store.get(key) : store.getAll()

//     request.onsuccess = (event) => {
//       resolve((event.target as IDBRequest<unknown[]>).result)
//     }

//     request.onerror = (event) => {
//       reject((event.target as IDBRequest)?.error as Error)
//     }
//   })
// }

// async function put(store: IDBObjectStore, cacheKey: string, value: unknown): Promise<boolean> {
//   return await new Promise((resolve) => {
//     const request = store.put(value, cacheKey)

//     request.onerror = () => {
//       resolve(false)
//     }

//     request.onsuccess = () => {
//       resolve(true)
//     }
//   })
// }

// async function clear(store: IDBObjectStore): Promise<boolean> {
//   return await new Promise((resolve) => {
//     const request = store.clear()

//     request.onerror = () => {
//       resolve(false)
//     }

//     request.onsuccess = () => {
//       resolve(true)
//     }
//   })
// }

// export const IDB = {
//   open,
//   get,
//   put,
//   clear
// }
