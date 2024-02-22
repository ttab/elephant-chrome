import { useRegistry, useYObserver } from '@/hooks'
import { Calendar } from '@ttab/elephant-ui/icons'
import type * as Y from 'yjs'

export const PlanDate = ({ yArray }: { yArray?: Y.Array<Y.Map<unknown>> }): JSX.Element => {
  const [start] = useYObserver<string>(yArray, '[0].data.start_date')
  const [end] = useYObserver<string>(yArray, '[0].data.end_date')
  const { locale, timeZone } = useRegistry()

  return (
    <div className='flex w-fit space-x-2'>
      <Calendar className='h-4 w-4' />
      { typeof start === 'string' && <span className='text-sm font-normal leading-4'>{formatDate(start, locale, timeZone)}</span>}
      {start !== end && <span className='text-sm font-normal leading-4'>{formatDate(end, locale, timeZone)}</span>}
    </div>
  )
}

function formatDate(value: string, locale: string, timeZone: string): string | null {
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
