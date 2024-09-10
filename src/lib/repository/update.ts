import { type Session } from 'next-auth'
import { type UpdateResponse } from '@/protos/service'

export const update = async ({ session, status }: {
  session: Session | null
  status: {
    version: bigint
    name: string
    documentId: string
  }
}): Promise<UpdateResponse> => {
  const { documentId, version, name } = status
  const response = await fetch(`${process.env.REPOSITORY_URL}/twirp/elephant.repository.Documents/Update`, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + session?.accessToken
    },
    body: JSON.stringify({ uuid: documentId, status: [{ name, version }] })
  })

  const result = await response.json()
  return result
}
