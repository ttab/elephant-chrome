interface TokenData {
  accessToken: string
  expiresAt: number
}

export class TokenService {
  #tokenData: TokenData | null = null
  tokenUrl: string
  readonly #clientId: string
  readonly #clientSecret: string
  scope: string

  constructor(tokenUrl: string, clientId: string, clientSecret: string, scope: string) {
    this.tokenUrl = tokenUrl
    this.#clientId = clientId
    this.#clientSecret = clientSecret
    this.scope = scope
  }

  /**
   * Returns a valid access token, refreshing it if needed.
   */
  async getAccessToken(): Promise<string> {
    const now = Date.now()

    if (this.#tokenData && this.#tokenData.expiresAt > now + 60000) {
      return this.#tokenData.accessToken
    }

    this.#tokenData = await this.fetchToken()
    return this.#tokenData.accessToken
  }

  /**
   * Fetches a new access token using the client credentials flow.
  */
  private async fetchToken(): Promise<TokenData> {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.#clientId,
      client_secret: this.#clientSecret,
      scope: this.scope
    })

    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json'
      },
      body: body
    })

    if (!response.ok) {
      throw new Error(`Token request failed with status ${response.statusText}`)
    }

    const data = await response.json()

    return {
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000
    }
  }
}
