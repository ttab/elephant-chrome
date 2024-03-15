import { type DefaultValueOption } from '@/types'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@ttab/elephant-ui'
import { useMemo } from 'react'

export const Type = ({ data }: { data: DefaultValueOption[] }): JSX.Element => {
  return useMemo(() => (
    <div className='flex items-center'>
      {data.map((item, index) => {
        return item.icon && (
          <TooltipProvider key={index}>
            <Tooltip>
              <TooltipTrigger>
                <item.icon className='mr-2 h-5 w-5 text-muted-foreground' color='#818FB4' />
              </TooltipTrigger>
              <TooltipContent>
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      })}
    </div>
  ), [data])
}
