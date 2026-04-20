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
  const [articleLinks] = useYValue<Block[]>(ydoc.ele, 'links.core/article')
  const [currentType] = useYValue<string>(ydoc.ele, 'root.type')
  const source = articleLinks?.find((link) => link.rel === 'source')
  const sourcePlanningId = useDeliverableInfo(source?.uuid ?? '')?.planningUuid

  if (!source?.uuid) {
    return <></>
  }

  // Article ↔ timeless is the only conversion that leaves a rel='source'
  // back-link, so the source type is the opposite of the current type.
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
