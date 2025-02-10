import { SharedWorker } from './SharedWorker'

declare let self: SharedWorkerGlobalScope

// -@ts-expect-error We don't have types for self.onconnect
self.onconnect = (event: MessageEvent) => {
  const worker = SharedWorker.getInstance()
  worker.addClient(event.ports[0])
}
