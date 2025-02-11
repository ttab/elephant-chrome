import type { Index } from '@/shared/Index'
import type { Repository } from '@/shared/Repository'
import { BoolQueryV1, QueryV1 } from '@ttab/elephant-api/index'
import type { Session } from 'next-auth'
import type { Wire } from '.'
import { fields } from '.'

export async function fetch({ index, session, source, page = 1 }: {
  index: Index | undefined
  repository: Repository | undefined
  session: Session | null
  page?: number
  source?: string[]
}): Promise<Wire[] | undefined> {
  if (!index || !session?.accessToken) {
    return undefined
  }

  const size = 40

  const { ok, hits, errorMessage } = await index.query({
    accessToken: session.accessToken,
    documentType: 'tt/wire',
    page,
    size,
    sort: [{ field: 'modified', desc: true }],
    fields,
    query: constructQuery(source)
  })

  if (!ok) {
    throw new Error(errorMessage || 'Unknown error while searching for text assignments')
  }

  return hits
}

/**
 * Get query
 *
 * @param date - The date to format for the query.
 * @returns The formatted query object.
 */
function constructQuery(source: string[] | undefined): QueryV1 | undefined {
  if (!source || !source?.length) {
    return
  }

  return QueryV1.create({
    conditions: {
      oneofKind: 'bool',
      bool: BoolQueryV1.create({
        must: [
          {
            conditions: {
              oneofKind: 'terms',
              terms: {
                field: 'document.rel.source.uri',
                values: source
              }
            }
          }
        ]
      })
    }
  })
}
