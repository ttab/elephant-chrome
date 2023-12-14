import { isoStringToHumanReadableTime } from '@/lib/datetime'
import { useRegistry } from '@/hooks'

export const TimeDisplay = ({ isoString }: { isoString: string }): JSX.Element => {
  const { locale, timeZone } = useRegistry()

  return (
    <span className='font-medium'>
      {isoStringToHumanReadableTime(isoString, locale, timeZone) || '-'}
    </span>
  )
}
