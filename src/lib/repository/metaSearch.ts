import { type GetMetaResponse } from '@/protos/service'
import { type Session } from 'next-auth'

export const metaSearch = async ({ session, documentId, repositoryUrl }: {
  session: Session | null
  documentId: string
  repositoryUrl: URL
}): Promise<GetMetaResponse | undefined> => {
  try {
    const searchUrl = new URL('/twirp/elephant.repository.Documents/GetMeta', repositoryUrl.href)

    const response = await fetch(searchUrl, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + session?.accessToken
      },
      body: JSON.stringify({ uuid: documentId })
    })

    if (!response.ok) {
      return undefined
    }

    const result = await response.json()
    return result
  } catch (ex) {
    throw new Error('Failed fetching metadata', { cause: ex as Error })
  }
}
