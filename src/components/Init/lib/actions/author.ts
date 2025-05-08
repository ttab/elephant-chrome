import type { IndexSearchResult } from '@/shared/Index'
import { Index } from '@/shared/Index'
import type { Repository } from '@/shared/Repository'
import { Document } from '@ttab/elephant-api/newsdoc'
import { BoolQueryV1, QueryV1, TermQueryV1 } from '@ttab/elephant-api/index'
import { Block } from '@ttab/elephant-api/newsdoc'
import type { Session } from 'next-auth'
import { decodeJwt } from 'jose'
import { toast } from 'sonner'
import { fields } from '@/hooks/index/useDocuments/schemas/author'
import type { Author, AuthorFields } from '@/hooks/index/useDocuments/schemas/author'

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
export async function initializeAuthor({ url, session, repository }: {
  url: URL
  repository: Repository
  session: Session
}): Promise<true> {
  let operation: 'create' | 'update' = 'create'

  try {
    const client = new Index(url.href)
    const envRole = url.href.includes('.stage.') ? 'stage' : 'prod'

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
                    field: 'document.meta.core_author.data.sub.keyword',
                    value: session.user.sub
                  })
                }
              },
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

    const isValid = verifyAuthorDoc(authorDoc, envRole, session)
    if (isValid) {
      console.info('Author document exist and is valid')
      return true
    }

    // Create a new author document if it doesn't exist or is invalid
    const document = isValid === false
      ? (operation = 'update', appendSub(authorDoc.hits[0].document!, session, envRole))
      : createAuthorDoc(session, envRole, 'sv-se')

    const result = await repository.saveDocument(document, session.accessToken, 0n, 'usable')
    if (result?.status.code !== 'OK') {
      throw new Error(`Failed to ${operation} author doc`)
    }

    toast.success(`Författardokument ${operation === 'update' ? 'är uppdaterat' : 'är skapat'}`)
    return true
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    toast.error(`Kunde inte ${operation === 'update' ? 'uppdatera' : 'skapa'} författardokument: ${errorMessage}`)
    throw new Error(`Failed to initialize author: ${errorMessage}`)
  }
}

/**
 * Verifies the author document by checking if it matches the user's environment role.
 *
 * @param document - The search result containing potential author documents.
 * @param envRole - The environment role, either 'stage' or 'prod'.
 * @param session - The session containing user information.
 * @returns True if a matching author document is found, false if none match, or undefined if no documents exist.
 * @throws If more than one author document is found.
 */
function verifyAuthorDoc(document: IndexSearchResult<Author>, envRole: 'stage' | 'prod', session: Session): boolean | undefined {
  if (document.hits?.length > 1) {
    toast.error('Flera författardokument hittades, kontakta support')
    throw new Error(`More than one author document found for sub: ${session.user.sub} email: ${session.user.email}`)
  }

  if (document.hits?.[0]?.document) {
    return document.hits[0].document?.links
      .some((link) => link.type === 'tt/keycloak' && link.role === envRole)
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

  // remove old same-as links from migrated users
  document.links = document.links?.filter((link) => link?.type !== 'x-imid/user') || []
  document.links.push(Block.create({
    rel: 'same-as',
    type: 'tt/keycloak',
    uri: `core://user/sub/${session.user.sub
      .replace('core://user/', '')}`,
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
    language
  })

  return appendSub(document, session, envRole)
}
