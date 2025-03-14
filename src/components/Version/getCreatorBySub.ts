import type { IDBAuthor } from 'src/datastore/types'

export const getCreatorBySub = ({ authors, creator }: { authors: IDBAuthor[], creator?: string }) => {
  if (!creator) {
    return undefined
  }

  return authors?.find((a) => {
    const subId = creator?.slice(creator?.lastIndexOf('/') + 1)
    if (subId) {
      return a?.sub?.includes(subId)
    }
    return false
  })
}
