import { TwirpFetchTransport } from '@protobuf-ts/twirp-transport'
import type { GetItemRequest, SearchRequest } from '@ttab/elephant-tt-api/ntb'
import { MediaClient } from '@ttab/elephant-tt-api/ntb'
import { meta } from './meta'

export class NTB {
  readonly #client: MediaClient

  constructor(ntbUrl: string) {
    this.#client = new MediaClient(
      new TwirpFetchTransport({
        baseUrl: new URL('twirp', ntbUrl).toString(),
        sendJson: true,
        jsonOptions: {
          ignoreUnknownFields: true
        }
      })
    )
  }

  async search(request: SearchRequest, accessToken: string) {
    return this.#client.search(request, meta(accessToken))
  }

  async getItem(request: GetItemRequest, accessToken: string) {
    return this.#client.getItem(request, meta(accessToken))
  }
}
