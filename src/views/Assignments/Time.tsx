import { Tooltip } from '@ttab/elephant-ui'
import { AlarmClockCheck, Clock1, Clock9 } from '@ttab/elephant-ui/icons'
import type { LucideProps } from 'lucide-react'
import { memo, useMemo } from 'react'

const icons: Record<string, React.FC<LucideProps>> = {
  start: Clock1,
  fullday: Clock9,
  publish: AlarmClockCheck
}

const TimeComponent = ({ time, type, tooltip }: { time: string, type: 'start' | 'fullday' | 'publish', tooltip?: string }): JSX.Element => {
  const Icon = useMemo(() => icons[type] || null, [type])

  const content = (
    <div className='flex items-center gap-2 basis-8 text-muted-foreground'>
      {Icon && <Icon size={18} />}
      <div className='w-full text-black'>{time}</div>
    </div>
  )

  return tooltip ? <Tooltip content={tooltip}>{content}</Tooltip> : content
}

export const Time = memo(TimeComponent)
