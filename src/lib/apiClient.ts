import { Api } from '@ttab/api-client'

const apiClient = async (token: string, host: URL): Promise<Api> => {
  const client = new Api({ host: host.origin, token, timeout: 6000 })
  return client
}

export default apiClient
