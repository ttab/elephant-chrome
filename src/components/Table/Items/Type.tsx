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
    const openDocument = item.value === 'flash' ? openFlash : openArticle
    if (deliverableId) {
      openDocument(event, { id: deliverableId })
    }
  }, [deliverableId, openArticle, openFlash])

  return useMemo(() => (
    <div className='flex items-center'>
      {data.map((item, index) => {
        return item.icon && (
          <Button
            key={index}
            size='xs'
            variant='icon'
            onClick={(event) => handleLink(event, item)}
            className={cn('p-0', deliverableId ? 'cursor-pointer' : 'cursor-not-allowed', className)}
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
