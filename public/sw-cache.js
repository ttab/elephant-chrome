self.addEventListener('install', (event) => {
  // The promise that skipWaiting() returns can be safely ignored.
  self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const match = event.request.url.match(/https?:\/\/[^/]+(.*)/i)
  if (match?.length !== 2) {
    return
  }

  switch (match[1]) {
    case '/core_author/_search':
      event.respondWith(handleFetch('cached-searches', event.request))
      break
  }
})


async function handleFetch(storeName, request) {
  console.debug(`Caching ${request.url}`)

  const db = await openDatabase(storeName)
  // FIXME: Should be a hash
  const cacheKey = await serializeRequest(request)
  // FIXME: This never returns anything
  const cachedResponse = await getCachedResponse(db, storeName, cacheKey)

  if (cachedResponse) {
    console.debug('CACHE HIT:', cachedResponse)
    return cachedResponse
  }

  // Clone the request, it can only be consumed once
  try {
    const response = await fetch(request.clone())
    if (response && response.status === 200) {
      await cacheResponse(db, storeName, cacheKey, response.clone())
    }

    console.debug('FRESH: ', response)
    return response
  } catch (error) {
    console.error('Fetch failed:', error)
    throw error
  }
}

async function serializeRequest(request) {
  const clonedRequest = request.clone()

  const serializedRequest = {
    url: clonedRequest.url,
    method: clonedRequest.method,
    headers: {},
    body: await clonedRequest.clone().text()
  }

  for (const [key, value] of clonedRequest.headers.entries()) {
    serializedRequest.headers[key] = value
  }

  return JSON.stringify(serializedRequest)
}

function openDatabase(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('elephant-cache', 1)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      db.createObjectStore(storeName)
    }

    request.onsuccess = (event) => {
      resolve(event.target.result)
    }

    request.onerror = (event) => {
      reject(event.target.error)
    }
  })
}

function getCachedResponse(db, objectStore, key) {
  return new Promise((resolve, reject) => {
    const store = db
      .transaction(objectStore, 'readonly')
      .objectStore(objectStore)

    const request = store.get(key)

    request.onsuccess = (event) => {
      resolve(event.target.result)
    }

    request.onerror = (event) => {
      reject(event.target.error)
    }
  })
}

async function cacheResponse(db, storeName, cacheKey, response) {
  const clonedResponse = response.clone()
  const body = await clonedResponse.text()
  const serializedResponse = {
    status: clonedResponse.status,
    statusText: clonedResponse.statusText,
    headers: {},
    body
  }

  for (const [key, value] of clonedResponse.headers.entries()) {
    serializedResponse.headers[key] = value
  }

  await putInCache(db, storeName, cacheKey, serializedResponse)
}

function putInCache(db, storeName, cacheKey, serializedResponse) {
  const store = db
    .transaction(storeName, 'readwrite')
    .objectStore(storeName)


  return new Promise((resolve, reject) => {
    const request = store.put(serializedResponse, cacheKey)

    request.onsuccess = () => resolve

    request.onerror = (event) => {
      reject(event.target.error)
    }
  })
}
