import type { Index } from '@/shared/Index'
import { type HitV1 } from '@ttab/elephant-api/index'
import type { Session } from 'next-auth'
import type { Repository } from '@/shared/Repository'

export async function usableOnly<T extends HitV1>({ repository, hits, session, index }: {
  repository: Repository | undefined
  hits: T[]
  session: Session | null
  index?: Index
}): Promise<T[]> {
  if (!session || !index || hits.length === 0) return []

  const usableVersions = hits.map((hit) => ({ uuid: hit.id, version: BigInt(hit.fields['heads.usable.version'].values[0]) }))
  const usables = await repository?.getDocuments({
    documents: usableVersions,
    accessToken: session.accessToken })

  hits.forEach((hit) => {
    if (!hit.id) {
      return
    }
    const match = usables && usables.items.find((item) => item.document?.uuid === hit.id)

    if (match) {
      console.log(typeof hit.fields)
      hit.fields['_usable_title'] = { values: [match.document?.title ? match.document.title : ''] }
    }
  })
  return hits
}
