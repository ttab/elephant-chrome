import { useMemo, type JSX } from 'react'
import useSWR from 'swr'
import { QueryV1, TermsQueryV1, type HitV1 } from '@ttab/elephant-api/index'
import { fetch as fetchDocuments } from '@/hooks/index/useDocuments/lib/fetch'
import { useRegistry, useLink } from '@/hooks'
import { useSession } from 'next-auth/react'
import { useTranslation } from 'react-i18next'

const fields = [
  'document.title',
  'document.rel.section.title',
  'modified'
] as const

export const LinkedArticles = ({ documentId }: { documentId: string }): JSX.Element | null => {
  const { index } = useRegistry()
  const { data: session } = useSession()
  const openArticle = useLink('Editor')
  const { t } = useTranslation('factbox')

  const query = useMemo(() => QueryV1.create({
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
    () => fetchDocuments<HitV1, typeof fields>({
      index: index!,
      session: session!,
      documentType: 'core/article',
      fields,
      query,
      sort: [{ field: 'modified', desc: true }],
      size: 100
    })
  )

  if (!data?.length) return null

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
          return (
            <li key={article.id}>
              <button
                className='text-sm text-left hover:underline w-full'
                onClick={(e) => openArticle(e, { id: article.id })}
              >
                <span className='text-xs text-gray-500 dark:text-gray-400 ml-1'>
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
