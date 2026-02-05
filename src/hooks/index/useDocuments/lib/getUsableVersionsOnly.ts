import type { Repository } from '@/shared/Repository'
import type { HitV1 } from '@ttab/elephant-api/index'
import type { Session } from 'next-auth'


export const getUsableVersionsOnly = async <T extends HitV1>({ result, repository, session}: {
  result: T[]
  repository: Repository | undefined
  session: Session }) => {
  if (!result || !repository || !session) {
    return result
  }

  // If usable version different from current version and usable version not equal to -1 fetch usable version from Repot
  const documentsToUpdate = result.filter((item) => (item.fields['heads.usable.version'] && item.fields['heads.usable.version'].values[0] !== item.fields['current_version'].values[0]) && (item.fields['heads.usable.version'].values[0] !== '-1'))
    .map((item) => {
      return {
        uuid: item.id,
        version: BigInt(item.fields['heads.usable.version'] ? item.fields['heads.usable.version'].values[0] : '')
      }
    })
  // usable version current version and usable version inte lika med -1
  const usables = await repository?.getDocuments({
    documents: documentsToUpdate,
    accessToken: session.accessToken
  })

  result.forEach((document) => {
    if (!document.id) {
      return
    }
    const match = usables && usables.items.find((item) => item.document?.uuid === document.id)
    if (match) {
      document.fields['document.title'].values[0] = match.document?.title ? match.document.title : ''
    }
  })

  return result
}
