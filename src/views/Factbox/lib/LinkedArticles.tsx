import { useMemo, type JSX } from 'react'
import useSWR from 'swr'
import { QueryV1, TermsQueryV1, type HitV1 } from '@ttab/elephant-api/index'
import type { Block } from '@ttab/elephant-api/newsdoc'
import { fetch as fetchDocuments } from '@/hooks/index/useDocuments/lib/fetch'
import { useRegistry, useLink } from '@/hooks'
import { useSession } from 'next-auth/react'
import { useTranslation } from 'react-i18next'
import { CheckIcon } from '@ttab/elephant-ui/icons'

const articleFields = [
  'document.title',
  'document.rel.section.title',
  'modified'
] as const

const SUBSET_NAME = 'factbox'
const SUBSET_DSL = `${SUBSET_NAME}=.content(type='core/factbox')`

const extractTextNodes = (content: Block[] | undefined): string[] => {
  return (content ?? [])
    .filter((b) => b.type === 'core/text')
    .map((b) => b.data?.text ?? '')
}

type SyncState = 'unknown' | 'inSync' | 'outOfSync'

interface LinkedArticlesProps {
  documentId: string
  sourceTexts: string[]
}

export const LinkedArticles = ({ documentId, sourceTexts }: LinkedArticlesProps): JSX.Element | null => {
  const { index, repository } = useRegistry()
  const { data: session } = useSession()
  const openArticle = useLink('Editor')
  const { t } = useTranslation('factbox')

  const articleQuery = useMemo(() => QueryV1.create({
    conditions: {
      oneofKind: 'terms',
      terms: TermsQueryV1.create({
        field: 'document.content.core_factbox.rel.source.uuid',
        values: [documentId]
      })
    }
  }), [documentId])

  const { data } = useSWR(
    session?.accessToken && index ? `linked-articles/${documentId}` : null,
    () => fetchDocuments<HitV1, typeof articleFields>({
      index: index!,
      session: session!,
      documentType: 'core/article',
      fields: articleFields,
      query: articleQuery,
      sort: [{ field: 'modified', desc: true }],
      size: 100
    })
  )

  const articleIds = useMemo(
    () => data?.map((a) => a.id).filter((id): id is string => !!id) ?? [],
    [data]
  )

  const { data: blocksByArticle } = useSWR(
    session?.accessToken && repository && articleIds.length
      ? `linked-articles-blocks/${documentId}/${articleIds.join(',')}`
      : null,
    async () => {
      const response = await repository!.getDocuments({
        documents: articleIds.map((uuid) => ({ uuid })),
        accessToken: session!.accessToken,
        subset: [SUBSET_DSL]
      })

      const result = new Map<string, Block[]>()

      for (const item of response?.items ?? []) {
        if (!item.uuid) continue

        const blocks: Block[] = (item.subset ?? [])
          .map((entry) => entry.values?.[SUBSET_NAME]?.block)
          .filter((b): b is Block => b !== undefined)

        result.set(item.uuid, blocks)
      }

      return result
    }
  )

  const syncStateByArticle = useMemo(() => {
    const result = new Map<string, SyncState>()
    if (!blocksByArticle) {
      return result
    }

    const sourceJoined = sourceTexts.join('\n')

    for (const [articleId, blocks] of blocksByArticle) {
      const matchingBlock = blocks.find((b) => b.links?.[0]?.uuid === documentId)
      if (!matchingBlock) {
        result.set(articleId, 'unknown')
        continue
      }

      const embeddedJoined = extractTextNodes(matchingBlock.content).join('\n')
      result.set(articleId, embeddedJoined === sourceJoined ? 'inSync' : 'outOfSync')
    }

    return result
  }, [blocksByArticle, sourceTexts, documentId])

  if (!data?.length) {
    return null
  }

  return (
    <div className='mx-12 mt-4 mb-4 border rounded p-3'>
      <p className='text-sm font-semibold mb-2'>{t('usedInArticles')}</p>
      <ul className='flex flex-col gap-1'>
        {data.map((article) => {
          const title = article.fields['document.title']?.values[0] ?? article.id
          const modified = article.fields.modified?.values[0]
          const modifiedDate = new Date(modified)?.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })

          const syncState = article.id ? syncStateByArticle.get(article.id) : 'unknown'
          const isOutOfSync = syncState === 'outOfSync'
          const isInSync = syncState === 'inSync'

          return (
            <li key={article.id}>
              <button
                className='text-sm text-left hover:underline w-full flex items-center gap-2'
                onClick={(e) => openArticle(e, { id: article.id })}
              >
                <span className='w-3.5 shrink-0 flex items-center justify-center'>
                  {isOutOfSync && (
                    <span
                      className='inline-flex items-center justify-center w-3.5 h-3.5 text-[10px] font-bold text-white dark:text-black bg-cancelled rounded-full'
                      title={t('outOfSyncTooltip')}
                    >
                      !
                    </span>
                  )}
                  {isInSync && (
                    <CheckIcon
                      size={14}
                      strokeWidth={3}
                      className='text-white bg-green-600 rounded-full p-0.5'
                      aria-label={t('inSyncTooltip')}
                    >
                      <title>{t('inSyncTooltip')}</title>
                    </CheckIcon>
                  )}
                </span>
                <span className='text-xs text-gray-500 dark:text-gray-400'>
                  {`${modifiedDate} - ${title}`}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
