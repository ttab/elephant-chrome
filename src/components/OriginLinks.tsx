import type { JSX } from 'react'
import type { Block } from '@ttab/elephant-api/newsdoc'
import type * as Y from 'yjs'
import { Link } from '@/components'
import { useYValue, type YDocument } from '@/modules/yjs/hooks'
import { useDeliverableInfo } from '@/hooks/useDeliverableInfo'
import { useTranslation } from 'react-i18next'

type SourceType = 'core/article' | 'core/article#timeless'

export interface SourceDocumentInfo {
  sourceUuid: string
  sourceType: SourceType
  sourcePlanningId: string | undefined
}

// Within the `links.core/article` and `links.core/article#timeless` buckets,
// `rel='source-document'` is left only by article ↔ timeless conversion.
// The link carries the *source's* type, so look under the opposite bucket
// from the current document's type.
export const useSourceDocumentInfo = (
  ydoc: YDocument<Y.Map<unknown>>
): SourceDocumentInfo | null => {
  const [currentType] = useYValue<string>(ydoc.ele, 'root.type')
  const sourceType: SourceType = currentType === 'core/article#timeless'
    ? 'core/article'
    : 'core/article#timeless'
  const [sourceLinks] = useYValue<Block[]>(ydoc.ele, `links.${sourceType}`)
  const source = sourceLinks?.find((link) => link.rel === 'source-document')
  const sourcePlanningId = useDeliverableInfo(source?.uuid ?? '')?.planningUuid

  if (!source?.uuid) {
    return null
  }

  return { sourceUuid: source.uuid, sourceType, sourcePlanningId }
}

/**
 * Compact "Created from" entry. Links back to the source document and,
 * when present, the planning that source was attached to. Rendered in
 * the MetaSheet's Origin section in both live and read-only views.
 */
export const OriginLinks = ({
  sourceUuid,
  sourceType,
  sourcePlanningId
}: SourceDocumentInfo): JSX.Element => {
  const { t } = useTranslation()
  const sourceLinkLabel = sourceType === 'core/article'
    ? t('editor:derivedFromArticleLink')
    : t('editor:derivedFromTimelessLink')

  return (
    <div className='flex flex-wrap items-center gap-1 text-sm text-muted-foreground'>
      <Link
        to='Editor'
        props={{ id: sourceUuid }}
        target='last'
        className='underline hover:text-foreground'
      >
        {sourceLinkLabel}
      </Link>
      {sourcePlanningId && (
        <>
          <span>{t('editor:derivedFromConnector')}</span>
          <Link
            to='Planning'
            props={{ id: sourcePlanningId }}
            target='last'
            className='underline hover:text-foreground'
          >
            {t('editor:derivedFromPlanningLink')}
          </Link>
        </>
      )}
    </div>
  )
}
