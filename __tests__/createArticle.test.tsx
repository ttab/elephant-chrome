import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as Y from 'yjs'
import type { Session } from 'next-auth'
import type { TBElement } from '@ttab/textbit'
import type { Document, Block } from '@ttab/elephant-api/newsdoc'
import type { Repository } from '@/shared/Repository'
import type { EleBlock } from '@/shared/types'
import type { Wire } from '@/shared/schemas/wire'
import type { YDocument } from '@/modules/yjs/hooks'

vi.mock('@/views/WireCreation/lib/translateWireContent', () => ({
  translateWireContent: vi.fn()
}))

vi.mock('@/lib/index/addAssignment', () => ({
  addAssignmentWithDeliverable: vi.fn()
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

vi.mock('@/components/ToastAction', () => ({
  ToastAction: () => null
}))

vi.mock('@/lib/i18n', () => ({
  default: { t: (key: string) => key }
}))

vi.mock('@/shared/getContentSourceLink', () => ({
  getContentSourceLink: vi.fn()
}))

import { createArticle } from '@/views/WireCreation/lib/createArticle'
import { translateWireContent } from '@/views/WireCreation/lib/translateWireContent'
import { addAssignmentWithDeliverable } from '@/lib/index/addAssignment'
import { getContentSourceLink } from '@/shared/getContentSourceLink'
import { Block as BlockProto } from '@ttab/elephant-api/newsdoc'

const mockTranslate = vi.mocked(translateWireContent)
const mockAddAssignment = vi.mocked(addAssignmentWithDeliverable)
const mockGetContentSourceLink = vi.mocked(getContentSourceLink)

/**
 * Build a minimal YDocument fixture with title/slugline/newsvalue populated
 * the way the wire dialog's form components would. `createArticle` only reads
 * these three fields off `ydoc.ele`, so we don't need a full Yjs newsdoc shape.
 */
function buildYdoc(opts: {
  title?: string
  slugline?: string
  newsvalue?: string
} = {}): YDocument<Y.Map<unknown>> {
  const doc = new Y.Doc()
  const ele = doc.getMap('ele')

  doc.transact(() => {
    const root = new Y.Map<unknown>()
    root.set('title', opts.title ?? '')
    ele.set('root', root)

    const meta = new Y.Map<unknown>()

    const sluglineArr = new Y.Array<Y.Map<unknown>>()
    const sluglineBlock = new Y.Map<unknown>()
    sluglineBlock.set('value', opts.slugline ?? '')
    sluglineArr.push([sluglineBlock])
    meta.set('tt/slugline', sluglineArr)

    const newsvalueArr = new Y.Array<Y.Map<unknown>>()
    const newsvalueBlock = new Y.Map<unknown>()
    newsvalueBlock.set('value', opts.newsvalue ?? '')
    newsvalueArr.push([newsvalueBlock])
    meta.set('core/newsvalue', newsvalueArr)

    ele.set('meta', meta)
  })

  return {
    id: 'form-uuid',
    ele,
    ctx: doc.getMap('ctx'),
    connected: true,
    synced: true,
    online: true,
    visibility: true,
    isInProgress: false,
    setIsInProgress: vi.fn(),
    isChanged: false,
    setIsChanged: vi.fn(),
    transact: vi.fn(),
    send: vi.fn(),
    provider: null,
    user: null
  } as unknown as YDocument<Y.Map<unknown>>
}

function paragraph(text: string): TBElement {
  return {
    type: 'core/text',
    id: 'p',
    class: 'text',
    children: [{ text }]
  } as unknown as TBElement
}

function buildSession(): Session {
  return {
    accessToken: 'tok',
    org: 'core://org/tt',
    units: [],
    user: { name: 'Test', sub: 'keycloak://user/test' }
  } as unknown as Session
}

function buildRepository(): Repository & { saveDocument: ReturnType<typeof vi.fn> } {
  return {
    saveDocument: vi.fn().mockResolvedValue({
      response: { version: 1n },
      status: { code: 'OK' }
    })
  } as unknown as Repository & { saveDocument: ReturnType<typeof vi.fn> }
}

const baseArgs = {
  status: 'authenticated' as const,
  section: { uuid: 'section-uuid', title: 'Inrikes' },
  timeZone: 'Europe/Stockholm',
  articleId: 'article-uuid'
}

/** Find a Block in `blocks` matching the given type. Returns undefined if none. */
function findByType(blocks: Block[] | undefined, type: string): Block | undefined {
  return blocks?.find((b) => b.type === type)
}

/** Extract every `data.text` string from a content array (recursive). */
function textsIn(content: Block[]): string[] {
  const out: string[] = []
  const walk = (b: Block) => {
    if (b.data?.text) out.push(b.data.text)
    b.content?.forEach(walk)
  }
  content.forEach(walk)
  return out
}

describe('createArticle', () => {
  beforeEach(() => {
    mockTranslate.mockReset()
    mockAddAssignment.mockReset()
    mockGetContentSourceLink.mockReset()
    // Default: addAssignment succeeds with a planning id
    mockAddAssignment.mockResolvedValue('planning-uuid')
    // Default: no session content-source
    mockGetContentSourceLink.mockReturnValue(undefined)
  })

  describe('order of operations', () => {
    it('saves to repository BEFORE linking the assignment to the planning', async () => {
      const repository = buildRepository()
      mockTranslate.mockResolvedValue([paragraph('Hei')])

      await createArticle({
        ...baseArgs,
        ydoc: buildYdoc({ title: 'T' }),
        repository,
        session: buildSession(),
        wires: [],
        wireContent: [paragraph('Hello')],
        translationMode: 'standard',
        ntbUrl: 'https://ntb.example/'
      })

      const saveOrder = repository.saveDocument.mock.invocationCallOrder[0]
      const assignOrder = mockAddAssignment.mock.invocationCallOrder[0]

      expect(saveOrder).toBeLessThan(assignOrder)
    })

    it('passes articleId (not formId / ydoc.id) as deliverableId to addAssignment', async () => {
      // The whole point of the formId/articleId split: the planning must
      // reference the SAME UUID that was saved to the repository. A regression
      // that re-uses ydoc.id would put a dangling reference on the planning
      // and reproduce the original "empty article via planning" bug from a
      // different angle.
      const repository = buildRepository()

      await createArticle({
        ...baseArgs,
        articleId: 'the-real-article-id',
        ydoc: buildYdoc(), // ydoc.id is 'form-uuid' — must NOT be used here
        repository,
        session: buildSession(),
        translationMode: undefined
      })

      const savedUuid = (repository.saveDocument.mock.calls[0][0] as Document).uuid
      const deliverableId = (mockAddAssignment.mock.calls[0][0] as { deliverableId: string }).deliverableId

      expect(savedUuid).toBe('the-real-article-id')
      expect(deliverableId).toBe('the-real-article-id')
      expect(deliverableId).toBe(savedUuid)
    })
  })

  describe('translation failure', () => {
    it('throws TranslationError and does NOT save or link when translation rejects', async () => {
      const repository = buildRepository()
      mockTranslate.mockRejectedValue(new Error('boom'))

      await expect(createArticle({
        ...baseArgs,
        ydoc: buildYdoc(),
        repository,
        session: buildSession(),
        wireContent: [paragraph('Hello')],
        translationMode: 'standard',
        ntbUrl: 'https://ntb.example/'
      })).rejects.toThrow('TranslationError')

      expect(repository.saveDocument).not.toHaveBeenCalled()
      expect(mockAddAssignment).not.toHaveBeenCalled()
    })

    it('throws TranslationError and does NOT save when ntbUrl is missing', async () => {
      const repository = buildRepository()

      await expect(createArticle({
        ...baseArgs,
        ydoc: buildYdoc(),
        repository,
        session: buildSession(),
        wireContent: [paragraph('Hello')],
        translationMode: 'standard',
        ntbUrl: undefined
      })).rejects.toThrow('TranslationError')

      expect(repository.saveDocument).not.toHaveBeenCalled()
      expect(mockAddAssignment).not.toHaveBeenCalled()
      expect(mockTranslate).not.toHaveBeenCalled()
    })
  })

  describe('content', () => {
    it('saves the article with the translated content when translation succeeds', async () => {
      const repository = buildRepository()
      mockTranslate.mockResolvedValue([paragraph('Hei verda')])

      await createArticle({
        ...baseArgs,
        ydoc: buildYdoc({ title: 'T' }),
        repository,
        session: buildSession(),
        wireContent: [paragraph('Hello world')],
        translationMode: 'standard',
        ntbUrl: 'https://ntb.example/'
      })

      const saved = repository.saveDocument.mock.calls[0][0] as Document
      expect(textsIn(saved.content)).toContain('Hei verda')
      expect(textsIn(saved.content)).not.toContain('Hello world')
    })

    it('does not leak wire content into the article when translation is disabled', async () => {
      const repository = buildRepository()

      await createArticle({
        ...baseArgs,
        ydoc: buildYdoc({ title: 'Brand new' }),
        repository,
        session: buildSession(),
        // wireContent is irrelevant when translationMode is undefined; pass it
        // to prove it doesn't leak into the saved article. The exact template
        // shape (block count, roles) is owned by articleDocumentTemplate and
        // tested there — here we only assert the createArticle contract:
        // translation off ⇒ no wire body in the saved article.
        wireContent: [paragraph('Should not appear')],
        translationMode: undefined
      })

      expect(mockTranslate).not.toHaveBeenCalled()

      const saved = repository.saveDocument.mock.calls[0][0] as Document
      expect(textsIn(saved.content)).not.toContain('Should not appear')
    })
  })

  describe('document construction', () => {
    it('uses articleId as the saved document uuid and uri', async () => {
      const repository = buildRepository()

      await createArticle({
        ...baseArgs,
        articleId: 'a-fresh-article',
        ydoc: buildYdoc(),
        repository,
        session: buildSession(),
        translationMode: undefined
      })

      const saved = repository.saveDocument.mock.calls[0][0] as Document
      expect(saved.uuid).toBe('a-fresh-article')
      expect(saved.uri).toBe('core://article/a-fresh-article')
    })

    it('propagates section, slugline and newsvalue onto the saved article', async () => {
      const repository = buildRepository()

      await createArticle({
        ...baseArgs,
        ydoc: buildYdoc({ slugline: 'my-slug', newsvalue: '4' }),
        repository,
        session: buildSession(),
        translationMode: undefined
      })

      const saved = repository.saveDocument.mock.calls[0][0] as Document
      expect(findByType(saved.links, 'core/section')).toMatchObject({
        type: 'core/section',
        rel: 'section',
        uuid: 'section-uuid',
        title: 'Inrikes'
      })
      expect(findByType(saved.meta, 'tt/slugline')).toMatchObject({ value: 'my-slug' })
      expect(findByType(saved.meta, 'core/newsvalue')).toMatchObject({ value: '4' })
    })

    it('strips empty slugline and missing newsvalue from meta', async () => {
      const repository = buildRepository()

      await createArticle({
        ...baseArgs,
        ydoc: buildYdoc(), // empty slugline, empty newsvalue
        repository,
        session: buildSession(),
        translationMode: undefined
      })

      const saved = repository.saveDocument.mock.calls[0][0] as Document
      expect(findByType(saved.meta, 'tt/slugline')).toBeUndefined()
      expect(findByType(saved.meta, 'core/newsvalue')).toBeUndefined()
    })

    it('adds one tt/wire link per wire reference', async () => {
      const repository = buildRepository()
      const wires: Wire[] = [
        {
          id: 'wire-1',
          fields: {
            'document.title': { values: ['Wire one'] },
            current_version: { values: ['1'] }
          }
        },
        {
          id: 'wire-2',
          fields: {
            'document.title': { values: ['Wire two'] },
            current_version: { values: ['7'] }
          }
        }
      ] as unknown as Wire[]

      await createArticle({
        ...baseArgs,
        ydoc: buildYdoc(),
        repository,
        session: buildSession(),
        wires,
        translationMode: undefined
      })

      const saved = repository.saveDocument.mock.calls[0][0] as Document
      const wireLinks = saved.links.filter((b) => b.type === 'tt/wire')
      expect(wireLinks).toHaveLength(2)
      expect(wireLinks.map((b) => b.uuid)).toEqual(['wire-1', 'wire-2'])
      expect(wireLinks.map((b) => b.data?.version)).toEqual(['1', '7'])
    })
  })

  describe('content-source merging', () => {
    it('keeps the session-derived content-source when a wire carries the same URI', async () => {
      const repository = buildRepository()
      // Session default and wire-provided source share the same URI.
      const sharedUri = 'tt://content-source/tt'
      mockGetContentSourceLink.mockReturnValue(BlockProto.create({
        type: 'core/content-source',
        rel: 'source',
        uri: sharedUri,
        title: 'TT (session)'
      }))
      const wireSources: EleBlock[] = [
        // Same URI — must be de-duplicated, session entry must win.
        {
          type: 'core/content-source',
          rel: 'source',
          uri: sharedUri,
          title: 'TT (from wire)'
        } as unknown as EleBlock,
        // Different URI — must be included.
        {
          type: 'core/content-source',
          rel: 'source',
          uri: 'tt://content-source/ntb',
          title: 'NTB'
        } as unknown as EleBlock
      ]

      await createArticle({
        ...baseArgs,
        ydoc: buildYdoc(),
        repository,
        session: buildSession(),
        contentSources: wireSources,
        translationMode: undefined
      })

      const saved = repository.saveDocument.mock.calls[0][0] as Document
      const sources = saved.links.filter((b) => b.type === 'core/content-source')
      expect(sources).toHaveLength(2)
      const ttSource = sources.find((s) => s.uri === sharedUri)
      expect(ttSource?.title).toBe('TT (session)')
      const ntbSource = sources.find((s) => s.uri === 'tt://content-source/ntb')
      expect(ntbSource?.title).toBe('NTB')
    })

    it('omits the core/content-source link entirely when there are no sources', async () => {
      const repository = buildRepository()
      mockGetContentSourceLink.mockReturnValue(undefined)

      await createArticle({
        ...baseArgs,
        ydoc: buildYdoc(),
        repository,
        session: buildSession(),
        contentSources: undefined,
        translationMode: undefined
      })

      const saved = repository.saveDocument.mock.calls[0][0] as Document
      expect(findByType(saved.links, 'core/content-source')).toBeUndefined()
    })
  })

  describe('error and guard paths', () => {
    it('does nothing when status is not authenticated', async () => {
      const repository = buildRepository()

      await createArticle({
        ...baseArgs,
        status: 'loading',
        ydoc: buildYdoc(),
        repository,
        session: buildSession(),
        translationMode: undefined
      })

      expect(repository.saveDocument).not.toHaveBeenCalled()
      expect(mockAddAssignment).not.toHaveBeenCalled()
    })

    it('does nothing when repository is undefined', async () => {
      await createArticle({
        ...baseArgs,
        ydoc: buildYdoc(),
        repository: undefined,
        session: buildSession(),
        translationMode: undefined
      })

      expect(mockAddAssignment).not.toHaveBeenCalled()
    })

    it('throws CreateAssignmentError when addAssignment returns no planning id', async () => {
      const repository = buildRepository()
      mockAddAssignment.mockResolvedValue(undefined)

      await expect(createArticle({
        ...baseArgs,
        ydoc: buildYdoc(),
        repository,
        session: buildSession(),
        translationMode: undefined
      })).rejects.toThrow('CreateAssignmentError')

      // Article was already saved before addAssignment was attempted.
      expect(repository.saveDocument).toHaveBeenCalledTimes(1)
    })
  })
})
