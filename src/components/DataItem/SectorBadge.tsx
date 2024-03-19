import { Sectors } from '@/defaults'
import { Badge } from '@ttab/elephant-ui'
import { cn } from '@ttab/elephant-ui/utils'

export const SectorBadge = ({ color, value }: { color?: string, value: string }): JSX.Element => {
  const sector = Sectors.find((label) => label.value === value)
  const chosenColor = color || sector?.color

  return <Badge
    variant='outline'
    className='rounded-md bg-background h-7'
    data-row-action>
    <div className={cn('h-2 w-2 rounded-full mr-2', chosenColor || '')} data-row-action />
    <span className='text-muted-foreground text-sm font-sans font-normal whitespace-nowrap text-ellipsis' data-row-action>{sector?.label}</span>
  </Badge>
}
