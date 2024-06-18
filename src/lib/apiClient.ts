import { Api } from '@ttab/api-client'

const apiClient = async (token?: string, host?: string): Promise<Api> => {
  const client = new Api({ host, token, timeout: 6000 })
  return client
}

export default apiClient
