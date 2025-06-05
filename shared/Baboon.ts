import { TwirpFetchTransport } from '@protobuf-ts/twirp-transport'
import type { CopyArticleToFlowRequest, CreateFlowRequest, ListHypenationsRequest, RemoveHypenationRequest, RenderArticleRequest, SetHypenationRequest } from '@ttab/elephant-tt-api/baboon'
import { PrintClient } from '@ttab/elephant-tt-api/baboon'
import { meta } from './meta'
import { toast } from 'sonner'
import { snapshot } from '@/lib/snapshot'

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
      await snapshot(payload?.articleUuid)
      return this.#client.renderArticle(payload, meta(accessToken))
    } catch (ex) {
      console.error('Error rendering article:', ex)
      toast.error('Kunde inte rendrera artikel')
    }
  }

  async setHypenation(payload: SetHypenationRequest, accessToken: string) {
    try {
      return this.#client.setHypenation(payload, meta(accessToken))
    } catch (ex) {
      console.error('Error setting hyphenation:', ex)
      toast.error('Kunde inte stämma avstämningsordlista')
    }
  }

  async listHypenations(payload: ListHypenationsRequest, accessToken: string) {
    try {
      return this.#client.listHypenations(payload, meta(accessToken))
    } catch (ex) {
      console.error('Error listing hyphenations:', ex)
      toast.error('Kunde inte lista hyphenations')
    }
  }

  async removeHypenation(payload: RemoveHypenationRequest, accessToken: string) {
    try {
      return this.#client.removeHypenation(payload, meta(accessToken))
    } catch (ex) {
      console.error('Error removing hypenation:', ex)
      toast.error('Kunde inte ta bort hyphenation')
    }
  }
}
