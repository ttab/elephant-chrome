import {
  getWebInstrumentations,
  initializeFaro as initFaro,
  ReactIntegration
} from '@grafana/faro-react'

export async function initializeFaro({ url }: {
  url: URL
}): Promise<boolean> {
  try {
    initFaro({
      url: url.href,
      app: {
        name: 'elephant-chrome'
      },
      instrumentations: [
        ...getWebInstrumentations(),
        new ReactIntegration()
      ]
    })

    return Promise.resolve(true)
  } catch (error) {
    return Promise.reject(error as Error)
  }
}
