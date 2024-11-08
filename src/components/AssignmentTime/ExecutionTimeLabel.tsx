import { dateToReadableTime, dateToReadableDateTime } from "@/lib/datetime"

const isSameDate = (fromDate: string, toDate: string): boolean => {
  const f = new Date(fromDate)
  const t = new Date(toDate)

  return f.getFullYear() === t.getFullYear() && f.getMonth() === t.getMonth() && f.getDate() === t.getDate()
}

export const FromToDateTimeLabel = ({ fromDate, toDate, locale, timeZone }: { fromDate?: string | undefined, toDate?: string | undefined, locale: string, timeZone: string }): JSX.Element => {
  if (!fromDate || !toDate) {
    return <></>
  }
  const sameDay = isSameDate(fromDate, toDate)
  const sameTime = fromDate === toDate
  const from = dateToReadableDateTime(new Date(fromDate), locale, timeZone)
  const to = sameDay ? dateToReadableTime(new Date(toDate), locale, timeZone) : dateToReadableDateTime(new Date(toDate), locale, timeZone)
  return (
    <div className='font-sans text-sm'>
      {from} {!sameTime ? ` - ${to}` : ''}
    </div>
  )
}

export const FromDateTimeLabel = ({ fromDate, locale, timeZone }: { fromDate?: string | undefined, locale: string, timeZone: string }): JSX.Element => {
  if (!fromDate ) {
    return <></>
  }
  const from = dateToReadableDateTime(new Date(fromDate), locale, timeZone)
  return (
    <div className='font-sans text-sm'>{`${from}`}</div>
  )
}
