import { type Session } from 'next-auth'

interface UpdateResult {
  version: string
  uuid: string
}

export const update = async ({ session, status }: { session: Session | null, status: { version: number, name: string, documentId: string } }): Promise<UpdateResult> => {
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
