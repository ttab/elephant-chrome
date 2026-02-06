import { CircleIcon } from '@ttab/elephant-ui/icons'
import { cn } from '@ttab/elephant-ui/utils'

export const HistoryIcon = ({ status, isCurrent, isLast }: {
  status: string
  isCurrent?: boolean
  isLast?: boolean
}) => {
  const colors: Record<string, string> = {
    draft: 'oklch(75.17% 0.0138 285.94)',
    done: 'oklch(91.62% 0.1424 100.94)',
    saved: 'oklch(91.62% 0.1424 100.94)',
    approved: 'oklch(68.25% 0.1005 146.77)',
    read: 'oklch(68.25% 0.1005 146.77)',
    usable: 'oklch(75.53% 0.1157 260.64)',
    used: 'oklch(75.53% 0.1157 260.64)',
    withheld: 'oklch(77.69% 0.1218 206.47)',
    cancelled: 'oklch(63.58% 0.2088 25.41)',
    unpublished: 'oklch(64.8% 0.42 51.56)',
    flash: 'oklch(62.8% 0.257 29.23)',
    system: 'oklch(20% 0.0138 285.94)'
  }
  const color = status ? colors[status] : colors['draft']

  return (
    <>
      <CircleIcon
        fill={color}
        stroke={color}
        className={cn(
          'rounded-full',
          isCurrent ? 'w-3 h-3' : 'w-4 h-4'
        )}
        style={{
          outline: isCurrent ? `2px solid ${color}` : 'none',
          outlineOffset: '3px'
        }}
      />

      {!isLast
        && (
          <div
            className='absolute left-0 top-0.5 bottom-0.5 w-0.5'
            style={{
              backgroundColor: color,
              transform: 'translate(calc((var(--spacing) * 2) - 1px), calc(-50% + 2px))'
            }}
          />
        )}
    </>
  )
}
