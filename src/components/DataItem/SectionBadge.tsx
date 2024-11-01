import { Badge } from '@ttab/elephant-ui'
import { cn } from '@ttab/elephant-ui/utils'

export const SectionBadge = ({ title, color }: {
  title: string
  color?: string
}): JSX.Element => (
  <Badge
    variant='outline'
    className='rounded-md bg-background h-7'
    data-row-action
  >
    <div className={cn('hidden @5xl/view:[display:revert] h-2 w-2 rounded-full mr-2', color || '')} data-row-action />
    <span className='text-muted-foreground text-sm font-sans font-normal whitespace-nowrap text-ellipsis' data-row-action>{title}</span>
  </Badge>
)
