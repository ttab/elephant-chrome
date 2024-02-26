import { useRegistry, useYObserver } from '@/hooks'
import { Calendar } from '@ttab/elephant-ui/icons'

export const PlanDate = (): JSX.Element => {
  const { get: getStart } = useYObserver('meta.core/planning-item[0].data')
  const { get: getEnd } = useYObserver('meta.core/planning-item[0].data')
  const { locale, timeZone } = useRegistry()

  return (
    <div className='flex w-fit space-x-2'>
      <Calendar className='h-4 w-4' />
      { typeof getStart('start_date') === 'string' &&
        <span className='text-sm font-normal leading-4'>{formatDate(getStart('start_date') as string, locale, timeZone)}</span>}
      {getStart('start_date') !== getEnd('end_date') &&
        <span className='text-sm font-normal leading-4'>{formatDate(getEnd('end_date') as string, locale, timeZone)}</span>}
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
