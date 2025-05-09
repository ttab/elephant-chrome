import { StatusMenu } from '@/components/DocumentStatus/StatusMenu'
import { ViewHeader } from '@/components/View'
import type { ViewProps } from '@/types/index'
import { ZapIcon } from '@ttab/elephant-ui/icons'
import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useDeliverablePlanningId } from '@/hooks/index/useDeliverablePlanningId'

const BASE_URL = import.meta.env.BASE_URL || ''

export const FlashHeader = (props: ViewProps) => {
  return (
    <ViewHeader.Root>
      {!props.asDialog && (
        <ViewHeader.Title name='Flash' title='Flash' icon={ZapIcon} iconColor='#FF5150' />
      )}

      <ViewHeader.Content>
        <div className='flex w-full h-full items-center space-x-2 font-bold'>
          {props.asDialog && (
            <ViewHeader.Title name='Flash' title='Skapa ny flash' icon={ZapIcon} iconColor='#FF3140' />
          )}
        </div>

        {!props.asDialog && !!props.id && <ViewHeader.RemoteUsers documentId={props.id} />}
        {!props.asDialog && !!props.id && <StatusMenuHeader id={props.id} />}
      </ViewHeader.Content>

      <ViewHeader.Action onDialogClose={props.onDialogClose} />
    </ViewHeader.Root>
  )
}

const StatusMenuHeader = (props: ViewProps) => {
  const planningId = useDeliverablePlanningId(props.id || '')
  const [publishTime] = useState<string | null>(null)

  // FIXME: We must have a way to retrieve the publish time defined in the planning.
  // FIXME: When yjs opening of related planning have been fixed this should be readded/remade.
  // This code relies on having the planning assignment publish time available to be able
  // set the correct suggested publish time when scheduling an article for publish.
  // Without this code it will always suggest "now()".
  //
  // useEffect(() => {
  //   if (deliverablePlanning) {
  //     const { index } = deliverablePlanning.getAssignment()
  //     const [ass] = getValueByYPath<EleBlock>(deliverablePlanning.yRoot, `meta.core/assignment[${index}]`)

  //     if (ass) {
  //       setPublishTime((prev) => (ass.data.publish !== prev) ? ass.data.publish : prev)
  //     }
  //   }
  // }, [deliverablePlanning])

  // Callback to set correct withheld time to the assignment
  const onBeforeStatusChange = useCallback(async (newStatus: string, data?: Record<string, unknown>) => {
    if (!planningId) {
      toast.error('Kunde inte ändra status på flash! Det gick inte att hitta en kopplad planering.')
      return false
    }

    // We don't need to update publish time for flashes unless scheduling (when that would be?)
    if (newStatus !== 'withheld') {
      return true
    }

    // We require a valid publish time if scheduling
    if (newStatus === 'withheld' && !(data?.time instanceof Date)) {
      toast.error('Kunde inte schemalägga artikel! Tid eller datum är felaktigt angivet.')
      return false
    }


    try {
      const newPublishTime = ((data?.time instanceof Date))
        ? data.time.toISOString()
        : new Date().toISOString()

      const response = await fetch(`${BASE_URL}/api/documents/${planningId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assignment: {
            deliverableId: props.id,
            type: 'core/article',
            status: newStatus,
            publishTime: newPublishTime
          }
        })
      })

      if (!response.ok) {
        console.log('Failed backend call to set assignment publish time', response.status, response.statusText)
        toast.error('Det gick inte att ändra artikelns status. Uppdragets publiceringstid kunde inte ändras i den kopplade planeringen.')
        return false
      }
    } catch (ex) {
      console.error('Failed backend call to set publish time when changing status', (ex as Error).message)
      toast.error('Det gick inte att ändra artikelns status. Uppdragets publiceringstid kunde inte ändras i den kopplade planeringen.')
      return false
    }

    return true
  }, [planningId, props.id])

  return (
    <>
      {!!planningId && props.id && (
        <StatusMenu
          documentId={props.id}
          type='core/article' // same workflow as article?
          publishTime={publishTime ? new Date(publishTime) : undefined}
          onBeforeStatusChange={onBeforeStatusChange}
        />
      )}
    </>
  )
}
