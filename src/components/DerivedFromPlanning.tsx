import type { JSX } from 'react'
import type { Block } from '@ttab/elephant-api/newsdoc'
import type * as Y from 'yjs'
import { Link } from '@/components'
import { CalendarDaysIcon } from '@ttab/elephant-ui/icons'
import { useYValue, type YDocument } from '@/modules/yjs/hooks'
import { useDeliverableInfo } from '@/hooks/useDeliverableInfo'
import { useTranslation } from 'react-i18next'

/**
 * Banner rendered on an article editor when the article was derived from a
 * source article (via rel='source'). Links back to both the source article
 * and the planning the source was attached to, if any.
 */
export function DerivedFromPlanning({
  ydoc
}: {
  ydoc: YDocument<Y.Map<unknown>>
}): JSX.Element {
  const { t } = useTranslation()
  const [currentType] = useYValue<string>(ydoc.ele, 'root.type')

  // Article ↔ timeless is the only conversion that leaves a rel='source-document'
  // back-link, and the source link carries the *source's* type — so look
  // under the opposite bucket from the current document's type.
  const sourceLinksPath = currentType === 'core/article#timeless'
    ? 'links.core/article'
    : 'links.core/article#timeless'
  const [sourceLinks] = useYValue<Block[]>(ydoc.ele, sourceLinksPath)
  const source = sourceLinks?.find((link) => link.rel === 'source-document')
  const sourcePlanningId = useDeliverableInfo(source?.uuid ?? '')?.planningUuid

  if (!source?.uuid) {
    return <></>
  }

  const sourceLinkLabel = currentType === 'core/article#timeless'
    ? t('editor:derivedFromArticleLink')
    : t('editor:derivedFromTimelessLink')

  return (
    <div className='flex items-center gap-1.5 px-4 py-2 text-sm text-muted-foreground border-b'>
      <CalendarDaysIcon strokeWidth={1.75} size={16} className='mr-0.5' />
      <span>{t('editor:derivedFrom')}</span>
      <Link
        to='Editor'
        props={{ id: source.uuid }}
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
