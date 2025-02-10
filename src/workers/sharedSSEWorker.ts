import { SharedWorker } from './SharedWorker'

declare let self: SharedWorkerGlobalScope

self.onconnect = (event: MessageEvent) => {
  const worker = SharedWorker.getInstance()
  worker.addClient(event.ports[0])
}
