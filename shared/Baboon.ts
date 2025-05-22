import { TwirpFetchTransport } from '@protobuf-ts/twirp-transport'
import type { CopyArticleToFlowRequest, CreateFlowRequest, RenderArticleRequest, ListHyphenationsRequest } from '@ttab/elephant-tt-api/baboon'
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

  async renderArticle(payload: RenderArticleRequest, accessToken: string) {
    try {
      return this.#client.renderArticle(payload, meta(accessToken))
    } catch (ex) {
      console.error('Error rendering article:', ex)
      toast.error('Kunde inte rendrera artikel')
    }
  }
  
  async listHyphenations(payload: ListHyphenationsRequest, accessToken: string) {
    try {
      return this.#client.listHyphenations(payload, meta(accessToken))
    } catch (ex) {
      console.error('Error listing hyphenations:', ex)
      toast.error('Kunde inte lista avstämningsord')
    }
  }
}
