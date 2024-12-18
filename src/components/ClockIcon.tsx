import { Clock10Icon, Clock11Icon, Clock12Icon, Clock1Icon, Clock2Icon, Clock3Icon, Clock4Icon, Clock5Icon, Clock6Icon, Clock7Icon, Clock8Icon, Clock9Icon, ClockIcon as DefaultClockIcon } from '@ttab/elephant-ui/icons'

export const ClockIcon = ({ hour, color, className, strokeWidth = 1.75, size = 18 }: {
  hour?: number | 'string'
  color?: string
  className?: string
  strokeWidth?: number
  size?: number
}): JSX.Element => {
  const timeSlot = (typeof hour === 'string') ? parseInt(hour) : hour

  let Icon = DefaultClockIcon

  switch (timeSlot) {
    case 0:
    case 12:
      Icon = Clock12Icon
      break
    case 1:
    case 13:
      Icon = Clock1Icon
      break
    case 2:
    case 14:
      Icon = Clock2Icon
      break
    case 3:
    case 15:
      Icon = Clock3Icon
      break
    case 4:
    case 16:
      Icon = Clock4Icon
      break
    case 5:
    case 17:
      Icon = Clock5Icon
      break
    case 6:
    case 18:
      Icon = Clock6Icon
      break
    case 7:
    case 19:
      Icon = Clock7Icon
      break
    case 8:
    case 20:
      Icon = Clock8Icon
      break
    case 9:
    case 21:
      Icon = Clock9Icon
      break
    case 10:
    case 22:
      Icon = Clock10Icon
      break
    case 11:
    case 23:
      Icon = Clock11Icon
      break
  }

  return (
    <Icon
      className={className}
      color={color}
      strokeWidth={strokeWidth}
      size={size}
    />
  )
}
