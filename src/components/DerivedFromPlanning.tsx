import type { JSX } from 'react'
import type { Block } from '@ttab/elephant-api/newsdoc'
import type * as Y from 'yjs'
import { Link } from '@/components'
import { CalendarDaysIcon } from '@ttab/elephant-ui/icons'
import { useYValue, type YDocument } from '@/modules/yjs/hooks'
import { useDeliverablePlanningId } from '@/hooks/index/useDeliverablePlanningId'
import { useTranslation } from 'react-i18next'

/**
 * Banner rendered on an article editor when the article was derived from a
 * source article (via rel='source'). Resolves the source article's planning
 * through `useDeliverablePlanningId` and renders a link to it.
 */
export function DerivedFromPlanning({
  ydoc
}: {
  ydoc: YDocument<Y.Map<unknown>>
}): JSX.Element {
  const { t } = useTranslation()
  const [articleLinks] = useYValue<Block[]>(ydoc.ele, 'links.core/article')
  const source = articleLinks?.find((link) => link.rel === 'source')
  const sourcePlanningId = useDeliverablePlanningId(source?.uuid ?? '')

  if (!source?.uuid || !sourcePlanningId) {
    return <></>
  }

  return (
    <div className='flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground border-b'>
      <CalendarDaysIcon strokeWidth={1.75} size={16} />
      <span>{t('editor:derivedFromPlanning')}</span>
      <Link
        to='Planning'
        props={{ id: sourcePlanningId }}
        target='last'
        className='underline hover:text-foreground'
      >
        {t('editor:derivedFromPlanningLink')}
      </Link>
    </div>
  )
}
