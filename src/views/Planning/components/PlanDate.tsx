import { useYMap, useRegistry } from '@/hooks'
import { Calendar } from '@ttab/elephant-ui/icons'
import { type YMap } from 'node_modules/yjs/dist/src/internals'
import { useEffect } from 'react'
import type { PlanningComponentProps } from '@/types'

export const PlanDate = ({ isSynced, document }: PlanningComponentProps): JSX.Element => {
  const [start, , initStart] = useYMap('core/planning-item/start')
  const [end, , initEnd] = useYMap('core/planning-item/start')

  const { locale, timeZone } = useRegistry()

  useEffect(() => {
    if (!isSynced || !document) {
      return
    }

    const planningYMap: YMap<unknown> = document.getMap('planning')
    initStart(planningYMap)
    initEnd(planningYMap)
  }, [
    isSynced,
    document,
    initStart,
    initEnd
  ])

  return (
    <div className='flex w-fit space-x-2'>
      <Calendar className='h-4 w-4' color='#4848FA' />
      <span className='text-sm font-normal leading-4'>{formatDate(start as string, locale, timeZone)}</span>
      {start !== end && <span className='text-sm font-normal leading-4'>{formatDate(end as string, locale, timeZone)}</span>}
    </div>
  )
}

function formatDate(value: string | undefined, locale: string, timeZone: string): string | null {
  if (value === undefined) {
    return null
  }

  try {
    const parts: string[] = value.split('-')

    const date = new Date(
      parseInt(parts[0], 10),
      parseInt(parts[1], 10) - 1,
      parseInt(parts[2], 10)
    )

    const formattedDate = new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone
    }).format(date)

    return formattedDate
  } catch {
    return null
  }
}
