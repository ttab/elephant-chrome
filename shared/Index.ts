import { TwirpFetchTransport } from '@protobuf-ts/twirp-transport'
import {
  SearchV1Client,
  QueryV1,
  SortingV1,
  type HitV1
} from '@ttab/elephant-api/index'
import { meta } from './meta'
import { pagination } from '@/lib/pagination'

interface IndexSearchOptions {
  accessToken: string
  documentType: string
  page?: number
  size?: number
  fields?: string[]
  query?: QueryV1
  sort?: SortingV1[]
  loadSource?: boolean
  loadDocument?: boolean
}

interface IndexSearchResult {
  ok: boolean
  errorCode?: number
  errorMessage?: string
  total: number
  page: number
  pageSize: number
  pages: number
  hits: HitV1[]
}

export class Index {
  readonly #client: SearchV1Client

  constructor(indexUrl: string) {
    this.#client = new SearchV1Client(
      new TwirpFetchTransport({
        baseUrl: new URL('twirp', indexUrl).toString()
      })
    )
  }

  async query({ accessToken, documentType, page = 1, size = 50, fields = [], query, sort, loadDocument = false, loadSource: source = false }: IndexSearchOptions): Promise<IndexSearchResult> {
    const { from, pageSize } = pagination({ page, size })

    try {
      const { response } = await this.#client.query(
        {
          documentType,
          language: 'sv-se',
          from: BigInt(from),
          size: BigInt(pageSize),
          fields,
          sort: sort || [SortingV1.create({ field: 'created', desc: true })],
          query: query || QueryV1.create({
            conditions: {
              oneofKind: 'matchAll',
              matchAll: {}
            }
          }),
          source,
          searchAfter: [],
          loadDocument
        },
        meta(accessToken)
      )

      const total = Number(response?.hits?.total?.value) || 0
      const hits = response?.hits?.hits?.length || 0n

      return {
        ok: true,
        total,
        page,
        pages: (hits > 0 && total > 0) ? Math.ceil(total / pageSize) : 0,
        pageSize,
        hits: response.hits?.hits || []
      }
    } catch (err: unknown) {
      return {
        ok: false,
        errorCode: -1,
        errorMessage: `Unable to query index: ${(err as Error)?.message || 'Unknown error'}`,
        total: 0,
        page: 0,
        pageSize: 0,
        pages: 0,
        hits: []
      }
    }
  }
}
