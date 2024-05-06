import { Api } from '@ttab/api-client'

const apiClient = async (accessToken, contentApi) => {
  const _host = contentApi || 'https://api.stage.tt.se'
  // const client = new Api({ host: _host, token: accessToken, timeout: 6000 })
  const client = new Api({ host: _host, timeout: 6000 })
  return client
}

export default apiClient
