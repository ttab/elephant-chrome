import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Block } from '@ttab/elephant-api/newsdoc'
import type { TBElement, TBResource } from '@ttab/textbit'
import type { Session } from 'next-auth'
import type { Repository } from '@/shared/Repository'
import { createFactboxConsume } from '../src/plugins/Factboxes/consume'

type DragPayload = {
  id: string
  title: string
  text: string
  modified?: string
  original_version?: string
  original_updated?: string
  created?: string
  locally_changed?: string
}

const session = { accessToken: 'tok' } as unknown as Session

const makeInput = (payload: DragPayload): TBResource => ({
  source: 'drag',
  type: 'application/json',
  data: JSON.stringify(payload)
})

// Match the consume.ts return shape so TS sees `data` as the produced block.
type ProducedBlock = {
  id: string
  class: 'block'
  type: 'core/factbox'
  properties: Record<string, string | undefined>
  children: TBElement[]
}

const runConsume = async (
  consume: ReturnType<typeof createFactboxConsume>,
  payload: DragPayload
) => {
  const result = await consume({ input: makeInput(payload) } as Parameters<typeof consume>[0])
  return result as { data: ProducedBlock } | undefined
}

const makeFactboxBlock = (overrides: {
  title?: string
  text?: string
  sourceUuid?: string
} = {}): Block => Block.create({
  type: 'core/factbox',
  title: overrides.title ?? '',
  content: [
    Block.create({ type: 'core/text', data: { text: overrides.text ?? '' } })
  ],
  links: overrides.sourceUuid
    ? [Block.create({ type: 'core/factbox', rel: 'source', uuid: overrides.sourceUuid })]
    : []
})

const makeRepo = () => {
  const getDocument = vi.fn()
  return { repo: { getDocument } as unknown as Repository, getDocument }
}

const ARTICLE_ID = '11111111-1111-1111-1111-111111111111'
const STANDALONE_ID = '22222222-2222-2222-2222-222222222222'
const SOURCE_ID = '33333333-3333-3333-3333-333333333333'

describe('createFactboxConsume', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('input validation', () => {
    it('throws when input is an array (bulk drop unsupported)', async () => {
      const { repo } = makeRepo()
      const consume = createFactboxConsume(repo, session)

      const arrayInput = [makeInput({ id: STANDALONE_ID, title: 't', text: '' })]

      await expect(
        consume({ input: arrayInput } as unknown as Parameters<typeof consume>[0])
      ).rejects.toThrow('Factbox plugin expected string for consumation, not a list/array')
    })

    it('throws when input.data is not a string', async () => {
      const { repo } = makeRepo()
      const consume = createFactboxConsume(repo, session)

      await expect(
        consume({
          input: { source: 'drag', type: 'application/json', data: 42 } as unknown as TBResource
        } as Parameters<typeof consume>[0])
      ).rejects.toThrow('Factbox plugin expected string for consumation')
    })
  })

  describe('embedded id parsing (EMBEDDED_ID_RE)', () => {
    it('parses "articleId:embedded:N" and fetches the article with the parsed uuid', async () => {
      const { repo, getDocument } = makeRepo()
      getDocument.mockResolvedValue({
        document: {
          content: [
            makeFactboxBlock({ sourceUuid: SOURCE_ID })
          ]
        }
      })
      const consume = createFactboxConsume(repo, session)

      await runConsume(consume, {
        id: `${ARTICLE_ID}:embedded:0`,
        title: 't',
        text: ''
      })

      expect(getDocument).toHaveBeenCalledWith({ uuid: ARTICLE_ID, accessToken: 'tok' })
    })

    it('selects the nth core/factbox block — siblings of other types are skipped', async () => {
      const { repo, getDocument } = makeRepo()
      getDocument.mockResolvedValue({
        document: {
          content: [
            Block.create({ type: 'core/heading-1' }),
            makeFactboxBlock({ text: 'first', sourceUuid: SOURCE_ID }),
            Block.create({ type: 'core/text', data: { text: 'middle' } }),
            makeFactboxBlock({ text: 'second' })
          ]
        }
      })
      const consume = createFactboxConsume(repo, session)

      const result = await runConsume(consume, {
        id: `${ARTICLE_ID}:embedded:1`,
        title: 'second-title',
        text: 'second'
      })

      // Index 1 is the second core/factbox in content order, not the
      // second element in the raw content array.
      const body = result?.data.children.find((c) => c.type === 'core/factbox/body')
      const text = (body?.children?.[0] as TBElement | undefined)?.children
      expect(text).toEqual([{ text: 'second' }])
    })

    it('falls back to fallbackChildren when the embedded index is out of bounds', async () => {
      const { repo, getDocument } = makeRepo()
      getDocument.mockResolvedValue({
        document: {
          content: [makeFactboxBlock({ text: 'only' })]
        }
      })
      const consume = createFactboxConsume(repo, session)

      const result = await runConsume(consume, {
        id: `${ARTICLE_ID}:embedded:42`,
        title: 'payload title',
        text: 'payload body'
      })

      // Fallback uses payload.title verbatim — no transformFactbox involvement.
      const title = result?.data.children.find((c) => c.type === 'core/factbox/title')
      expect((title?.children as { text: string }[])[0].text).toBe('payload title')
    })

    it('non-embedded id is used as a document uuid directly (standalone factbox)', async () => {
      const { repo, getDocument } = makeRepo()
      getDocument.mockResolvedValue({
        document: {
          uuid: STANDALONE_ID,
          uri: `core://factbox/${STANDALONE_ID}`,
          url: '',
          type: 'core/factbox',
          title: 'standalone-title',
          content: [Block.create({ type: 'core/text', data: { text: 'body' } })],
          links: [],
          meta: []
        }
      })
      const consume = createFactboxConsume(repo, session)

      await runConsume(consume, {
        id: STANDALONE_ID,
        title: 'whatever',
        text: 'whatever'
      })

      expect(getDocument).toHaveBeenCalledWith({ uuid: STANDALONE_ID, accessToken: 'tok' })
    })
  })

  describe('source id resolution (the bug fixed in 9643d4e0)', () => {
    it('embedded factbox: uses the block source link uuid, not the composite payload id', async () => {
      const { repo, getDocument } = makeRepo()
      getDocument.mockResolvedValue({
        document: {
          content: [makeFactboxBlock({ sourceUuid: SOURCE_ID })]
        }
      })
      const consume = createFactboxConsume(repo, session)

      const result = await runConsume(consume, {
        id: `${ARTICLE_ID}:embedded:0`,
        title: 't',
        text: ''
      })

      // properties.id and properties.original_id both come from the source
      // link, not from `${ARTICLE_ID}:embedded:0` (which would fail the
      // factbox.ts uuid-validity check downstream).
      expect(result?.data.properties.id).toBe(SOURCE_ID)
      expect(result?.data.properties.original_id).toBe(SOURCE_ID)
    })

    it('embedded factbox without a source link: leaves sourceId undefined (does not leak the composite id)', async () => {
      const { repo, getDocument } = makeRepo()
      getDocument.mockResolvedValue({
        document: {
          content: [makeFactboxBlock()] // no source link
        }
      })
      const consume = createFactboxConsume(repo, session)

      const result = await runConsume(consume, {
        id: `${ARTICLE_ID}:embedded:0`,
        title: 't',
        text: ''
      })

      expect(result?.data.properties.id).toBeUndefined()
      expect(result?.data.properties.original_id).toBeUndefined()
    })

    it('standalone factbox: uses payload.id as the source id', async () => {
      const { repo, getDocument } = makeRepo()
      getDocument.mockResolvedValue({
        document: {
          uuid: STANDALONE_ID,
          type: 'core/factbox',
          title: 't',
          content: [],
          links: [],
          meta: []
        }
      })
      const consume = createFactboxConsume(repo, session)

      const result = await runConsume(consume, {
        id: STANDALONE_ID,
        title: 't',
        text: ''
      })

      expect(result?.data.properties.id).toBe(STANDALONE_ID)
      expect(result?.data.properties.original_id).toBe(STANDALONE_ID)
    })
  })

  describe('repository failure handling', () => {
    it('treats a repository.getDocument rejection as no document and uses fallback children', async () => {
      const { repo, getDocument } = makeRepo()
      getDocument.mockRejectedValue(new Error('boom'))
      const consume = createFactboxConsume(repo, session)

      const result = await runConsume(consume, {
        id: STANDALONE_ID,
        title: 'fallback title',
        text: 'fallback body line 1\nfallback body line 2'
      })

      // No transformFactbox path → fallbackChildren uses payload.text split on newlines.
      const body = result?.data.children.find((c) => c.type === 'core/factbox/body')
      const bodyTexts = (body?.children as TBElement[]).map(
        (c) => (c.children as { text: string }[])[0].text
      )
      expect(bodyTexts).toEqual(['fallback body line 1', 'fallback body line 2'])
    })

    it('returns a result even when getDocument resolves to null/undefined document (standalone)', async () => {
      const { repo, getDocument } = makeRepo()
      getDocument.mockResolvedValue(null)
      const consume = createFactboxConsume(repo, session)

      const result = await runConsume(consume, {
        id: STANDALONE_ID,
        title: 'payload',
        text: 'p1'
      })

      const title = result?.data.children.find((c) => c.type === 'core/factbox/title')
      expect((title?.children as { text: string }[])[0].text).toBe('payload')
    })
  })

  describe('fallback when repository/session is missing', () => {
    it('uses payload-only fallback children when repository is undefined', async () => {
      const consume = createFactboxConsume(undefined, session)

      const result = await runConsume(consume, {
        id: STANDALONE_ID,
        title: 'no-repo title',
        text: 'line A\nline B'
      })

      const title = result?.data.children.find((c) => c.type === 'core/factbox/title')
      expect((title?.children as { text: string }[])[0].text).toBe('no-repo title')

      const body = result?.data.children.find((c) => c.type === 'core/factbox/body')
      const bodyTexts = (body?.children as TBElement[]).map(
        (c) => (c.children as { text: string }[])[0].text
      )
      expect(bodyTexts).toEqual(['line A', 'line B'])
    })

    it('uses fallback children when session is null (no access token to call repository)', async () => {
      const { repo, getDocument } = makeRepo()
      const consume = createFactboxConsume(repo, null)

      const result = await runConsume(consume, {
        id: STANDALONE_ID,
        title: 'no-session title',
        text: 'one'
      })

      expect(getDocument).not.toHaveBeenCalled()
      const title = result?.data.children.find((c) => c.type === 'core/factbox/title')
      expect((title?.children as { text: string }[])[0].text).toBe('no-session title')
    })

    it('still produces a sourceId from payload.id when standalone and no repository is available', async () => {
      const consume = createFactboxConsume(undefined, session)

      const result = await runConsume(consume, {
        id: STANDALONE_ID,
        title: 't',
        text: ''
      })

      expect(result?.data.properties.original_id).toBe(STANDALONE_ID)
    })

    it('leaves sourceId undefined for an embedded payload when no repository is available', async () => {
      // Composite id must never leak into original_id even on the fallback path.
      const consume = createFactboxConsume(undefined, session)

      const result = await runConsume(consume, {
        id: `${ARTICLE_ID}:embedded:0`,
        title: 't',
        text: ''
      })

      expect(result?.data.properties.id).toBeUndefined()
      expect(result?.data.properties.original_id).toBeUndefined()
    })
  })
})
