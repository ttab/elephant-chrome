import type { ViewMetadata, ViewProps } from '@/types'
import { type JSX, useMemo, useRef } from 'react'
import { useQuery } from '@/hooks/useQuery'
import { Error } from '../Error'
import { getTemplateFromView } from '@/shared/templates/lib/getTemplateFromView'
import { toGroupedNewsDoc } from '@/shared/transformations/groupedNewsDoc'
import type { Document } from '@ttab/elephant-api/newsdoc'
import { QuickArticleDialog } from './QuickArticleDialog'
import { useTranslation } from 'react-i18next'

const meta: ViewMetadata = {
  name: 'QuickArticle',
  path: `${import.meta.env.BASE_URL || ''}/quick-article`,
  widths: {
    sm: 12,
    md: 12,
    lg: 6,
    xl: 6,
    '2xl': 6,
    hd: 6,
    fhd: 4,
    qhd: 3,
    uhd: 2
  }
}

export const QuickArticle = (props: ViewProps & {
  document?: Document
}): JSX.Element => {
  const [query] = useQuery()
  const { t } = useTranslation('quickArticle')

  const persistentDocumentId = useRef<string>('')
  if (!persistentDocumentId.current) {
    persistentDocumentId.current = crypto.randomUUID()
  }

  // We must not read query.id if we are in a dialog or we pick up other documents ids
  const documentId = props.id || (!props.asDialog && query.id) || persistentDocumentId.current

  const data = useMemo(() => {
    if (!documentId || typeof documentId !== 'string') {
      return undefined
    }

    return toGroupedNewsDoc({
      version: 0n,
      isMetaDocument: false,
      mainDocument: '',
      document: props.document || getTemplateFromView('QuickArticle')(documentId)
    })
  }, [documentId, props.document])

  // Error handling for missing document
  if ((!props.asDialog && !documentId) || typeof documentId !== 'string') {
    return (
      <Error
        title={t('errors.quickArticleMissing')}
        message={t('errors.quickArticleMissingDescription')}
      />
    )
  }

  return <QuickArticleDialog {...props} documentId={documentId} data={data} asDialog />
}

QuickArticle.meta = meta
