import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Block, Document } from '@ttab/elephant-api/newsdoc'
import type { Session } from 'next-auth'
import type { Repository } from '@/shared/Repository'

// The default factbox template doesn't forward links from its payload,
// so to actually exercise the `factboxDocument.links = []` reset we mock
// the template here to return a Document that arrives with links set.
const templateFnMock = vi.fn()
vi.mock('@/shared/templates/lib/getTemplateFromView', () => ({
  getTemplateFromView: () => templateFnMock
}))

import { createNewFactbox } from '@/components/Header/lib/createNewFactbox'

const session = { accessToken: 'tok' } as unknown as Session
const ID = 'fb-id-1'

const makeRepo = (saveImpl?: ReturnType<typeof vi.fn>) => {
  const saveDocument = saveImpl ?? vi.fn().mockResolvedValue(undefined)
  return { saveDocument } as unknown as Repository & { saveDocument: ReturnType<typeof vi.fn> }
}

describe('createNewFactbox', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default implementation mirrors factboxDocumentTemplate (no links).
    templateFnMock.mockImplementation((
      id: string,
      payload?: { title?: string, content?: Block[] }
    ) => Document.create({
      uuid: id,
      type: 'core/factbox',
      uri: `core://factbox/${id}`,
      title: payload?.title ?? '',
      content: payload?.content ?? [Block.create({ type: 'core/text', data: { text: '' } })]
    }))
  })

  describe('dependency guards', () => {
    it('throws the localized error when session is null', async () => {
      const repo = makeRepo()
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(createNewFactbox(repo, null, ID)).rejects.toThrow('Kunde inte skapa ny faktaruta!')
      expect(repo.saveDocument).not.toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('throws when session has no accessToken', async () => {
      const repo = makeRepo()
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(
        createNewFactbox(repo, { accessToken: undefined } as unknown as Session, ID)
      ).rejects.toThrow('Kunde inte skapa ny faktaruta!')
      expect(repo.saveDocument).not.toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('throws when repository is undefined', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(createNewFactbox(undefined, session, ID))
        .rejects.toThrow('Kunde inte skapa ny faktaruta!')

      consoleErrorSpy.mockRestore()
    })
  })

  describe('save behaviour', () => {
    it('saves a fresh factbox document with the placeholder title and returns the id', async () => {
      const repo = makeRepo()

      const result = await createNewFactbox(repo, session, ID)

      expect(result).toBe(ID)
      expect(repo.saveDocument).toHaveBeenCalledTimes(1)

      const [saved, accessToken] = repo.saveDocument.mock.calls[0] as [Document, string]
      expect(accessToken).toBe('tok')
      expect(saved.uuid).toBe(ID)
      expect(saved.type).toBe('core/factbox')
      expect(saved.uri).toBe(`core://factbox/${ID}`)
      // Placeholder title is the editor:factbox.factboxNewTitle i18n string + ":"
      expect(saved.title.endsWith(':')).toBe(true)
    })

    it('clears links from the template result before saving (schema safety net)', async () => {
      const repo = makeRepo()
      // Override the template so it returns a Document that arrives with links
      // already set. createNewFactbox must reset them — that's the bug guard.
      templateFnMock.mockImplementationOnce((id: string) => Document.create({
        uuid: id,
        type: 'core/factbox',
        uri: `core://factbox/${id}`,
        title: 'T',
        content: [Block.create({ type: 'core/text', data: { text: '' } })],
        links: [Block.create({ type: 'core/factbox', rel: 'source', uuid: 'leaked-source' })]
      }))

      await createNewFactbox(repo, session, ID)

      const [saved] = repo.saveDocument.mock.calls[0] as [Document]
      expect(saved.links).toEqual([])
    })

    it('forwards document.content onto the new template (open-original code path)', async () => {
      const repo = makeRepo()
      const original = Document.create({
        uuid: 'src',
        type: 'core/factbox',
        title: 'Original title',
        content: [
          Block.create({ type: 'core/text', data: { text: 'paragraph one' } }),
          Block.create({ type: 'core/text', data: { text: 'paragraph two' } })
        ]
      })

      await createNewFactbox(repo, session, ID, original)

      const [saved] = repo.saveDocument.mock.calls[0] as [Document]
      expect(saved.title).toBe('Original title')
      expect(saved.content.map((b) => b.data?.text)).toEqual(['paragraph one', 'paragraph two'])
      // Even when forwarding content, the new doc gets the new id/uri.
      expect(saved.uuid).toBe(ID)
      expect(saved.uri).toBe(`core://factbox/${ID}`)
    })

    it('wraps a repository.saveDocument rejection in the localized error and preserves the cause', async () => {
      const underlying = new Error('repository network down')
      const repo = makeRepo(vi.fn().mockRejectedValue(underlying))

      try {
        await createNewFactbox(repo, session, ID)
        throw new Error('expected createNewFactbox to reject')
      } catch (err) {
        expect(err).toBeInstanceOf(Error)
        expect((err as Error).message).toBe('Kunde inte skapa ny faktaruta!')
        expect((err as Error).cause).toBe(underlying)
      }
    })
  })
})
