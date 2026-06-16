import type { IndexSearchResult } from '@/shared/Index'
import { Index } from '@/shared/Index'
import type { Repository } from '@/shared/Repository'
import { Document } from '@ttab/elephant-api/newsdoc'
import { BoolQueryV1, QueryV1, TermQueryV1 } from '@ttab/elephant-api/index'
import { Block } from '@ttab/elephant-api/newsdoc'
import type { Session } from 'next-auth'
import { decodeJwt } from 'jose'
import { toast } from 'sonner'
import { fields } from '@/shared/schemas/author'
import type { Author, AuthorFields } from '@/shared/schemas/author'
import {
  normalizeUserUri,
  extractUserIdFromUri,
  generateAuthorUUID
} from '@/shared/userUri'
import type { TFunction } from 'i18next'
import { getSystemLanguage } from '@/shared/getSystemLanguage'

/**
 * Initializes the author by verifying or creating an author document in the repository.
 *
 * @param params - An object containing the URL, session, and repository.
 * @param params.url - The URL of the environment.
 * @param params.session - The session containing user and access token information.
 * @param params.repository - The repository used to query and save documents.
 * @returns A promise that resolves to true if the initialization is successful.
 * @throws If the author document cannot be created or updated.
 */
export async function initializeAuthor({ url, session, repository, t }: {
  url: URL
  repository: Repository
  session: Session
  t: TFunction
}): Promise<true> {
  let operation: 'create' | 'update' = 'create'

  try {
    if (!extractUserIdFromUri(session.user.sub)) {
      throw new Error(`Invalid user URI: ${session.user.sub}`)
    }

    const client = new Index(url.href)
    const envRole = url.href.includes('.stage.') ? 'stage' : 'prod'

    const userId = extractUserIdFromUri(session.user.sub)

    const authorDoc = await client.query<Author, AuthorFields>({
      accessToken: session.accessToken,
      documentType: 'core/author',
      loadDocument: true,
      fields,
      query: QueryV1.create({
        conditions: {
          oneofKind: 'bool',
          bool: BoolQueryV1.create({
            should: [
              {
                conditions: {
                  oneofKind: 'term',
                  term: TermQueryV1.create({
                    field: 'document.rel.same_as.uri',
                    value: normalizeUserUri(session.user.sub)
                  })
                }
              },
              ...(userId
                ? [{
                    conditions: {
                      oneofKind: 'term' as const,
                      term: TermQueryV1.create({
                        field: 'document.rel.same_as.uri',
                        value: `core://user/sub/${userId}`
                      })
                    }
                  }]
                : []),
              ...(session.user.sub !== normalizeUserUri(session.user.sub)
                ? [{
                    conditions: {
                      oneofKind: 'term' as const,
                      term: TermQueryV1.create({
                        field: 'document.rel.same_as.uri',
                        value: session.user.sub
                      })
                    }
                  }]
                : []),
              {
                conditions: {
                  oneofKind: 'term',
                  term: TermQueryV1.create({
                    field: 'document.meta.core_contact_info.data.email.keyword',
                    value: session.user.email
                  })
                }
              }
            ]
          })
        }
      })
    })

    if (!authorDoc.ok) {
      throw new Error(`Failed to fetch author document: ${authorDoc.errorMessage}`)
    }

    const isValid = verifyAuthorDoc(authorDoc, envRole, session, t)
    if (isValid) {
      console.info('Author document exist and is valid')
      return true
    }

    // Create a new author document if it doesn't exist or is invalid
    const document = isValid === false
      ? (operation = 'update', appendSub(authorDoc.hits[0].document!, session, envRole))
      : createAuthorDoc(session, envRole, getSystemLanguage())

    const result = await repository.saveDocument(document, session.accessToken, 'usable')
    if (result?.status.code !== 'OK') {
      throw new Error(`Failed to ${operation} author doc`)
    }

    if (operation === 'update') {
      toast.success(t('shared:operations.authorUpdateSuccess'))
    } else {
      toast.success(t('shared:operations.authorSaveSuccess'))
    }
    return true
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    if (operation === 'update') {
      toast.error(t('errors:toasts.authorUpdateFailure', { errorMessage }))
    } else {
      toast.error(t('errors:toasts.authorSaveFailure', { errorMessage }))
    }
    throw new Error(`Failed to initialize author: ${errorMessage}`, { cause: error })
  }
}

/**
 * Verifies that the author document is up-to-date with the current session.
 * Checks environment role, URI format (rejecting legacy /sub/ format),
 * and whether the stored user URI matches the current session sub.
 *
 * @param document - The search result containing potential author documents.
 * @param envRole - The environment role, either 'stage' or 'prod'.
 * @param session - The session containing user information.
 * @returns True if the document is valid and current, false if it exists
 *   but needs updating, or undefined if no document was found.
 * @throws If more than one author document is found.
 */
function verifyAuthorDoc(document: IndexSearchResult<Author>, envRole: 'stage' | 'prod', session: Session, t: TFunction): boolean | undefined {
  if (document.hits?.length > 1) {
    toast.error(t('errors:toasts.multipleAuthors'))
    throw new Error(`More than one author document found for sub: ${session.user.sub} email: ${session.user.email}`)
  }

  if (document.hits?.[0]?.document) {
    const doc = document.hits[0].document
    const hasRole = doc.links
      .some((link) => link.type === 'tt/keycloak'
        && link.role === envRole)
    if (!hasRole) return false

    const keycloakLink = doc.links
      .find((link) => link.rel === 'same-as'
        && link.type === 'tt/keycloak'
        && link.role === envRole)

    if (!keycloakLink) return false

    // Self-heal: reject legacy core://user/sub/{id} format so the
    // caller will re-save with the canonical core://user/{id} format
    if (keycloakLink.uri.includes('/sub/')) return false

    // Self-heal: re-save if the stored URI no longer matches the
    // current session (user ID may change across identity migrations)
    const currentUri = normalizeUserUri(session.user.sub)
    if (keycloakLink.uri !== currentUri) return false

    return true
  }

  return undefined
}

/**
 * Appends a "same-as" link to the document's links array, associating the document
 * with the user's unique identifier (sub) from the session.
 *
 * @param document - The document to which the link will be appended.
 * @param session - The session containing the user's information.
 * @param role - The role indicating the environment (stage or prod).
 * @throws If the session does not contain a user or the user's sub.
 * @returns The updated document with the appended link.
 */
function appendSub(document: Document, session: Session, role: 'stage' | 'prod'): Document {
  if (!session.user?.sub) {
    throw new Error('No sub in session')
  }

  if (!Array.isArray(document.links)) {
    document.links = []
  }

  // Remove old same-as links (x-imid/user and tt/keycloak) before adding new
  document.links = document.links?.filter(
    (link) => link?.type !== 'x-imid/user'
      && !(link?.rel === 'same-as' && link?.type === 'tt/keycloak')
  ) || []

  document.links.push(Block.create({
    rel: 'same-as',
    type: 'tt/keycloak',
    uri: normalizeUserUri(session.user.sub),
    role
  }))

  return document
}

/**
 * Creates an author document based on the session information and environment role.
 *
 * @param session - The session containing user and access token information.
 * @param envRole - The environment role, either 'stage' or 'prod'.
 * @param language - The language to be set for the document.
 * @returns The created author document after appending the "same-as" link.
 */
function createAuthorDoc(session: Session, envRole: 'stage' | 'prod', language: string) {
  const decodedToken = decodeJwt(session.accessToken) as {
    given_name: string
    family_name: string
  }

  const firstName = decodedToken.given_name
  const lastName = decodedToken.family_name

  if (!firstName || !lastName) {
    throw new Error('Cannot create author document: token missing given_name or family_name')
  }

  const uuid = generateAuthorUUID(session.user.sub)
  const document = Document.create({
    uuid,
    uri: `core://author/${uuid}`,
    type: 'core/author',
    title: session.user.name,
    meta: [
      Block.create({
        type: 'core/author',
        data: { firstName, lastName }
      }),
      ...(session.user.email
        ? [Block.create({
            type: 'core/contact-info',
            data: { email: session.user.email },
            role: 'office'
          })]
        : [])
    ],
    language
  })

  return appendSub(document, session, envRole)
}
