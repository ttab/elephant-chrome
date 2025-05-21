import { TwirpFetchTransport } from '@protobuf-ts/twirp-transport'
import type { CopyArticleToFlowRequest, CreateFlowRequest } from '@ttab/elephant-tt-api/baboon'
import { PrintClient } from '@ttab/elephant-tt-api/baboon'
import { meta } from './meta'
import { toast } from 'sonner'

export class Baboon {
  readonly #client: PrintClient

  constructor(baboonUrl: string) {
    this.#client = new PrintClient(
      new TwirpFetchTransport({
        baseUrl: new URL('twirp', baboonUrl).toString(),
        sendJson: true,
        jsonOptions: {
          ignoreUnknownFields: true
        }
      })
    )
  }

  async createPrintArticle(payload: CopyArticleToFlowRequest, accessToken: string) {
    try {
      return this.#client.copyArticleToFlow(payload, meta(accessToken))
    } catch (ex) {
      console.error('Error creating print article:', ex)
      toast.error('Kunde inte skapa printartikel')
    }
  }

  async createFlow(payload: CreateFlowRequest, accessToken: string) {
    try {
      return this.#client.createFlow(payload, meta(accessToken))
    } catch (ex) {
      console.error('Error creating print article:', ex)
      toast.error('Kunde inte skapa printflöde')
    }
  }
}
