import type { MouseEvent } from 'react'
import { useLink } from '@/hooks/useLink'
import { type DefaultValueOption } from '@/types'
import type { AssignmentMetaExtended } from '@/views/Assignments/types'
import { Button, Tooltip } from '@ttab/elephant-ui'
import { useCallback, useMemo } from 'react'
import { cn } from '@ttab/elephant-ui/utils'

export const Type = ({ data, deliverableId, className }: {
  data: DefaultValueOption[]
  deliverableId?: AssignmentMetaExtended['deliverableId']
  className?: string
}): JSX.Element => {
  const openArticle = useLink('Editor')
  const openFlash = useLink('Flash')

  const handleLink = useCallback((event: MouseEvent, item: DefaultValueOption) => {
    event.stopPropagation()
    if (deliverableId) {
      if (item.value === 'text') {
        openArticle(event, { id: deliverableId })
      }

      if (item.value === 'flash') {
        openFlash(event, { id: deliverableId })
      }
    }
  }, [deliverableId, openArticle, openFlash])

  return useMemo(() => (
    <div className='flex items-center'>
      {data.map((item, index) => {
        return item.icon && (
          <Button
            key={index}
            variant='icon'
            onClick={(event) => handleLink(event, item)}
            className={cn('p-0 h-7', deliverableId ? 'cursor-pointer' : 'cursor-not-allowed', className)}
          >
            <Tooltip content={item.label}>
              <item.icon size={18} strokeWidth={1.75} className='mr-2 text-muted-foreground' />
            </Tooltip>
          </Button>
        )
      })}
    </div>
  ), [data, deliverableId, handleLink, className])
}
