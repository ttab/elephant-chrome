import type { IndexSearchResult } from '@/shared/Index'
import { Index } from '@/shared/Index'
import type { Repository } from '@/shared/Repository'
import { Document } from '@ttab/elephant-api/newsdoc'
import { BoolQueryV1, QueryV1 } from '@ttab/elephant-api/index'
import { Block } from '@ttab/elephant-api/newsdoc'
import type { Session } from 'next-auth'
import { decodeJwt } from 'jose'

export async function initializeAuthor({ url, session, repository }: {
  url: URL
  repository: Repository
  session: Session
}): Promise<true> {
  const client = new Index(url.href)

  const authorDoc = await client.query({
    accessToken: session.accessToken,
    documentType: 'core/author',
    query: QueryV1.create({
      conditions: {
        oneofKind: 'bool',
        bool: BoolQueryV1.create({
          should: [
            {
              conditions: {
                oneofKind: 'term',
                term: {
                  field: 'document.meta.core_author.data.sub.keyword',
                  value: session.user.sub
                }
              }
            },
            {
              conditions: {
                oneofKind: 'term',
                term: {
                  field: 'document.meta.core_contact_info.data.email.keyword',
                  value: session.user.email
                }
              }
            }
          ]
        })
      }
    })
  })

  const isValid = verifyAuthorDoc(authorDoc)

  if (isValid === false) {
    const updatedDoc = appendSub(authorDoc.hits[0].document!, session)
    await repository.saveDoc(updatedDoc, session.accessToken, 0n)
    return true
  }

  if (isValid === undefined) {
    const newDocument = createAuthorDoc(session)
    await repository.saveDoc(newDocument, session.accessToken, 0n)

    return true
  }

  return true
}

function verifyAuthorDoc(document: IndexSearchResult): boolean | undefined {
  if (document.hits.length === 1) {
    return !!document.hits[0].document?.links
      .some((link) => link.type === 'tt/keycloak')
  }

  return undefined
}

function appendSub(document: Document, session: Session) {
  if (!session.user?.sub) {
    throw new Error('No sub in session')
  }

  if (!Array.isArray(document.links)) {
    document.links = []
  }

  const role = (import.meta.env.AUTH_KEYCLOAK_ISSUER as string || '')
    .includes('stage')
    ? 'stage'
    : 'prod'

  document.links.push(Block.create({
    rel: 'same-as',
    type: 'tt/keycloak',
    uri: `core://user/sub/${session.user.sub}`,
    role
  }))

  return document
}

function createAuthorDoc(session: Session) {
  const decodedToken = decodeJwt(session.accessToken) as { given_name: string, family_name: string }

  const uuid = crypto.randomUUID()
  const document = Document.create({
    uuid,
    uri: `core://author/${uuid}`,
    type: 'core/author',
    title: session.user.name,
    meta: [{
      type: 'core/author',
      data: {
        firstName: decodedToken.given_name,
        lastName: decodedToken.family_name
      }
    }],
    language: 'sv-se'
  })

  return appendSub(document, session)
}
