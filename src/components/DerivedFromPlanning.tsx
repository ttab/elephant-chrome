import type { JSX } from 'react'
import type { Block } from '@ttab/elephant-api/newsdoc'
import type * as Y from 'yjs'
import { Link } from '@/components'
import { useYValue, type YDocument } from '@/modules/yjs/hooks'
import { useDeliverableInfo } from '@/hooks/useDeliverableInfo'
import { useTranslation } from 'react-i18next'

interface SourceDocumentInfo {
  source: Block
  sourceType: 'core/article' | 'core/article#timeless'
  sourcePlanningId: string | undefined
}

// Article ↔ timeless conversion is the only flow that leaves a
// rel='source-document' back-link. The source link carries the *source's*
// type, so look under the opposite bucket from the current document's type.
export function useSourceDocumentInfo(
  ydoc: YDocument<Y.Map<unknown>>
): SourceDocumentInfo | null {
  const [currentType] = useYValue<string>(ydoc.ele, 'root.type')
  const sourceType = currentType === 'core/article#timeless'
    ? 'core/article'
    : 'core/article#timeless'
  const [sourceLinks] = useYValue<Block[]>(ydoc.ele, `links.${sourceType}`)
  const source = sourceLinks?.find((link) => link.rel === 'source-document')
  const sourcePlanningId = useDeliverableInfo(source?.uuid ?? '')?.planningUuid

  if (!source?.uuid) {
    return null
  }

  return { source, sourceType, sourcePlanningId }
}

/**
 * Compact "Created from" entry rendered inside the MetaSheet's Origin
 * section when the document was derived via article ↔ timeless conversion.
 */
export function DerivedFromPlanning({
  ydoc
}: {
  ydoc: YDocument<Y.Map<unknown>>
}): JSX.Element | null {
  const { t } = useTranslation()
  const info = useSourceDocumentInfo(ydoc)

  if (!info) {
    return null
  }

  const sourceLinkLabel = info.sourceType === 'core/article'
    ? t('editor:derivedFromArticleLink')
    : t('editor:derivedFromTimelessLink')

  return (
    <div className='flex flex-wrap items-center gap-1 text-sm text-muted-foreground'>
      <Link
        to='Editor'
        props={{ id: info.source.uuid }}
        target='last'
        className='underline hover:text-foreground'
      >
        {sourceLinkLabel}
      </Link>
      {info.sourcePlanningId && (
        <>
          <span>{t('editor:derivedFromConnector')}</span>
          <Link
            to='Planning'
            props={{ id: info.sourcePlanningId }}
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
