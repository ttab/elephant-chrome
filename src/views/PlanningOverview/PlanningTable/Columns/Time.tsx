import { TimeDisplay } from '@/components/DataItem/TimeDisplay'
import { useMemo } from 'react'

export const Time = ({ date }: { date: Date }): JSX.Element => {
  return useMemo(() => <TimeDisplay date={date} />, [date])
}
