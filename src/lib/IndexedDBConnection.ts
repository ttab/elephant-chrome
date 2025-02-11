export interface IndexedDBSpecification {
  name: string
  migrations: Array<{
    (db: IDBDatabase): void
  }>
}

export class IndexedDBConnection {
  readonly #name: string = ''
  readonly #version: number = 0
  readonly #specification: IndexedDBSpecification | null = null
  #db: IDBDatabase | null = null
  #onVersionChange: (() => void) | null = null

  constructor(spec: IndexedDBSpecification) {
    this.#name = spec.name
    this.#version = spec.migrations.length + 1
    this.#specification = spec
  }

  /**
   * Open the IndexedDB database without specifying a version to get current version.
   * If the version is 1 it was created with this call.
   */
  #currentVersion(): Promise<number> {
    return new Promise((resolve) => {
      const request = indexedDB.open(this.#name)

      request.onsuccess = () => {
        const db = request.result
        const version = db.version
        db.close()

        resolve(version)
      }

      request.onerror = () => {
        throw new Error(request.error?.message || `Failed checking migration index of ${this.#name}, unrecoverable error`)
      }
    })
  }

  /**
   * Run migrations
   */
  #migrate(db: IDBDatabase, fromMigration: number): void {
    for (const migrate of (this.#specification?.migrations || []).slice(fromMigration)) {
      migrate(db)
    }
  }

  /**
   * Delete database
   */
  async #deleteDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.#name)

      request.onerror = () => {
        reject(new Error(request.error?.message || `Failed deleting ${this.#name}, unrecoverable error`))
      }

      request.onsuccess = () => {
        resolve()
      }
    })
  }

  /**
   * Open the IndexedDB database and upgrade if necessary
   */
  async open(): Promise<IDBDatabase | null> {
    if (this.#db) {
      console.warn(`IndexedDb ${this.#name} version ${this.#version} is already opened`)
      return this.#db
    }

    const fromMigration = await this.#currentVersion() - 1
    const requestPromise = new Promise<IDBDatabase | null>((resolve) => {
      const request = indexedDB.open(this.#name, this.#version)

      request.onupgradeneeded = () => {
        this.#migrate(request.result, fromMigration)
      }

      request.onsuccess = () => {
        console.info('Successfully opened IndexedDB')
        resolve(request.result)
      }

      request.onerror = () => {
        if (request.error?.name === 'VersionError') {
          // The wanted version is lower than what exists in browser which only
          // should happen when earlier migrations have been removed or tampered
          // with. We try to recover by starting over. A wee bit messy.
          console.warn(`Deleting IndexedDB ${this.#name} to restart from scratch`)

          this.#deleteDatabase().then(() => {
            console.warn(`Trying to reinitalize IndexedDB ${this.#name}`)
            return this.open()
          }).then((newDb) => {
            resolve(newDb)
          }).catch((error) => {
            console.error(error)
            throw new Error(`Failed to reinitalize IndexedDB ${this.#name}, unrecoverable error`)
          })
        }

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

  close(): void {
    if (this.#db) {
      this.#db.close()
      this.#db = null
    }
  }

  get connected(): boolean {
    return !!this.#db
  }

  get name(): string {
    return this.#name
  }

  get version(): number {
    return this.#version
  }

  set onVersionChange(cb: () => void) {
    this.#onVersionChange = cb
  }

  /**
   * Put object in a specified object store
   */
  async putObject<T>(storeName: string, value: T, key?: IDBValidKey): Promise<void> {
    if (!this.#db) {
      return Promise.reject(new Error(`IndexedDB ${this.#name} is not open`))
    }

    const transaction = this.#db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)

    await new Promise<void>((resolve, reject) => {
      const request = store.put(value, key)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error as Error)
    })
  }

  /*
   * Get object/s from specified object store
  */
  async getObject<T>(storeName: string, key?: IDBValidKey): Promise<T | undefined> {
    if (!this.#db) {
      return Promise.reject(new Error(`IndexedDB ${this.#name} is not open`))
    }

    const transaction = this.#db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)

    return await new Promise<T | undefined>((resolve, reject) => {
      const request = key ? store.get(key) : store.getAll()

      request.onsuccess = () => resolve(request.result as T)
      request.onerror = () => reject(request.error as Error)
    })
  }

  /*
   * Clear an object store completely
  */
  async clearObjects(storeName: string): Promise<void> {
    if (!this.#db) {
      return Promise.reject(new Error(`IndexedDB ${this.#name} is not open`))
    }

    const transaction = this.#db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)

    await new Promise<void>((resolve, reject) => {
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error as Error)
    })
  }
}
