import { TwirpFetchTransport } from '@protobuf-ts/twirp-transport'
import {
  SearchV1Client,
  QueryV1,
  SortingV1,
  type HitV1,
  QueryRequestV1
} from '@ttab/elephant-api/index'
import { meta } from './meta'
import { pagination } from '@/lib/pagination'
import type { useDocumentsFetchOptions } from '@/hooks/index/useDocuments'

interface IndexSearchOptions<F> {
  accessToken: string
  documentType: string
  page?: number
  size?: number
  fields?: F
  query?: QueryV1
  sort?: SortingV1[]
  language?: string
  loadSource?: boolean
  loadDocument?: boolean
  options?: useDocumentsFetchOptions
}

export interface IndexSearchResult<T extends HitV1> {
  ok: boolean
  errorCode?: number
  errorMessage?: string
  total: number
  page: number
  pageSize: number
  pages: number
  hits: T[]
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

  async query<T extends HitV1, F>({
    accessToken,
    documentType,
    page = 1,
    size = 50,
    fields,
    query,
    sort,
    loadDocument = false,
    loadSource: source = false,
    language = '',
    options
  }: IndexSearchOptions<F>): Promise<IndexSearchResult<T>> {
    const { pageSize } = pagination({ page, size })

    try {
      const fetchPage = async (currentPage: number): Promise<IndexSearchResult<T>> => {
        const { response } = await this.#client.query(
          QueryRequestV1.create({
            documentType,
            language,
            from: BigInt((currentPage - 1) * size),
            size: BigInt(pageSize),
            fields: (fields as unknown as string[]) || [],
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
          }),
          meta(accessToken)
        )

        const total = Number(response?.hits?.total?.value) || 0
        const hits = response?.hits?.hits || []

        return {
          ok: true,
          total,
          page: currentPage,
          pages: Math.ceil(total / pageSize),
          pageSize,
          hits: hits as unknown as T[]
        }
      }

      if (options?.aggregatePages) {
        let currentPage = 1
        let allHits: HitV1[] = []
        let total = 0
        let pages = 0

        while (true) {
          const result = await fetchPage(currentPage)
          if (!result.ok || result.hits.length === 0) break

          allHits = allHits.concat(result.hits)
          total = result.total
          pages = result.pages

          if (currentPage >= pages) break
          currentPage++
        }

        return {
          ok: true,
          total,
          page: 1,
          pages,
          pageSize,
          hits: allHits as unknown as T[]
        }
      }

      return await fetchPage(page)
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
