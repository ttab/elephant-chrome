import { Badge } from '@ttab/elephant-ui'

export const FilterBadge = ({ labels }: {
  labels: string[]
}) => {
  if (!Array.isArray(labels) || !labels.length) {
    return
  }

  if (labels.length > 2) {
    return (
      <Badge variant='secondary' className='rounded-sm px-1 font-normal'>
        {labels.length}
        {' '}
        selected
      </Badge>
    )
  }


  return labels.map((value: string | number) => {
    return (
      <div key={value}>
        <Badge variant='secondary' className='rounded-sm px-1 font-normal mr-1'>
          {value}
        </Badge>
      </div>
    )
  })
}
