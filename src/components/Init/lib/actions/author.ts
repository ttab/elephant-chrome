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
  try {
    const client = new Index(url.href)

    const authorDoc = await client.query({
      accessToken: session.accessToken,
      documentType: 'core/author',
      loadDocument: true,
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

    const envRole = url.href.includes('stage')
      ? 'stage'
      : 'prod'

    const isValid = verifyAuthorDoc(authorDoc, envRole)

    if (isValid === false) {
      const updatedDoc = appendSub(authorDoc.hits[0].document!, session, envRole)
      const result = await repository.saveDocument(updatedDoc, session.accessToken, 0n)

      if (result?.status.code !== 'OK') {
        throw new Error('Failed to update author doc')
      }

      await repository.saveMeta({
        status: {
          version: result.response.version,
          uuid: result.response.uuid,
          name: 'usable'
        },
        accessToken: session.accessToken
      })

      return true
    }

    if (isValid === undefined) {
      const newDocument = createAuthorDoc(session, envRole)
      const result = await repository.saveDocument(newDocument, session.accessToken, 0n)

      if (result?.status.code !== 'OK') {
        throw new Error('Failed to create author doc')
      }

      await repository.saveMeta({
        status: {
          version: result.response.version,
          uuid: result.response.uuid,
          name: 'usable'
        },
        accessToken: session.accessToken
      })

      return true
    }

    return true
  } catch (error) {
    throw new Error(`Failed to initialize author: ${(error as Error).message}`)
  }
}

function verifyAuthorDoc(document: IndexSearchResult, envRole: 'stage' | 'prod'): boolean | undefined {
  if (document.hits?.[0]?.document) {
    return document.hits[0].document?.links
      .some((link) => link.type === 'tt/keycloak' && link.role === envRole)
  }

  return undefined
}

function appendSub(document: Document, session: Session, role: 'stage' | 'prod') {
  if (!session.user?.sub) {
    throw new Error('No sub in session')
  }

  if (!Array.isArray(document.links)) {
    document.links = []
  }

  document.links.push(Block.create({
    rel: 'same-as',
    type: 'tt/keycloak',
    uri: `core://user/sub/${session.user.sub
      .replace('core://user/', '')}`,
    role
  }))

  return document
}

function createAuthorDoc(session: Session, envRole: 'stage' | 'prod') {
  const decodedToken = decodeJwt(session.accessToken) as {
    given_name: string
    family_name: string
  }

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
    }, {
      type: 'core/contact-info',
      data: {
        email: session.user.email
      },
      role: 'office'
    }],
    language: 'sv-se'
  })

  return appendSub(document, session, envRole)
}
