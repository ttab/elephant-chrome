import { Badge } from '@ttab/elephant-ui'
import { cn } from '@ttab/elephant-ui/utils'

export const SectorBadge = ({ color, value }: { color?: string, value: string }): JSX.Element => {
  const sector = sectors.find((label) => label.value === value)
  const chosenColor = color || sector?.color

  return <Badge variant='outline' className='rounded-md'>
    <div className={cn('h-2 w-2 rounded-full mr-2', chosenColor || '')} />
    <span className='text-muted-foreground text-xs font-sans font-normal whitespace-nowrap text-ellipsis'>{sector?.label}</span>
  </Badge>
}

// FIXME: This should not be hardcoded!!!
const sectors = [
  {
    value: 'Utrikes',
    label: 'Utrikes',
    color: 'bg-[#BD6E11]'
  },
  {
    value: 'Inrikes',
    label: 'Inrikes',
    color: 'bg-[#DA90E1]'
  },
  {
    value: 'Sport',
    label: 'Sport',
    color: 'bg-[#6CA8DF]'
  },
  {
    value: 'Kultur och nöje',
    label: 'Kultur & Nöje',
    color: 'bg-[#12E1D4]'
  },
  {
    value: 'Ekonomi',
    label: 'Ekonomi',
    color: 'bg-[#FFB9B9]'
  }
]
