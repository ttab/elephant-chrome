import { type ColumnValueOption } from '@/types'
import { Tooltip } from '@ttab/elephant-ui'
import { useMemo } from 'react'

export const Type = ({ data }: { data: ColumnValueOption[] }): JSX.Element => {
  return useMemo(() => (
    <div className='flex items-center'>
      {data.map((item, index) => {
        return item.icon && (
        <Tooltip key={index} content={item.label}>
          <item.icon size={18} strokeWidth={1.75} className='mr-2 text-muted-foreground' />
        </Tooltip>
        )
      })}
    </div>
  ), [data])
}
