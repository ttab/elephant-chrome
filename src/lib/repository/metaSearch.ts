import { type Session } from 'next-auth'

interface MetaData {
  id: string
  version: string
  creator: string
  created: Date
}

export interface MetaHead {
  usable?: MetaData
  approved?: MetaData
  done?: MetaData
  withheld?: MetaData
}

export interface MetaResult {
  documentId: string
  meta: {
    created: Date
    modified: Date
    current_version: string
    heads: MetaHead
    acl: Array<{
      uri: string
      permissions: string[]
    }>
  }
}

export const metaSearch = async ({ session, documentId }: { session: Session | null, documentId: string }): Promise<MetaResult> => {
  const response = await fetch(`${process.env.REPOSITORY_URL}/twirp/elephant.repository.Documents/GetMeta`, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + session?.accessToken
    },
    body: JSON.stringify({ uuid: documentId })
  })

  const result = await response.json()
  return result
}
