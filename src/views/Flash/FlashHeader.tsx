import { StatusMenu } from '@/components/DocumentStatus/StatusMenu'
import { ViewHeader } from '@/components/View'
import { useDeliverablePlanning } from '@/hooks/useDeliverablePlanning'
import { getValueByYPath, setValueByYPath } from '@/lib/yUtils'
import type { EleBlock } from '@/shared/types'
import type { ViewProps } from '@/types/index'
import { ZapIcon } from '@ttab/elephant-ui/icons'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

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
  const deliverablePlanning = useDeliverablePlanning(props.id || '')
  const [publishTime, setPublishTime] = useState<string | null>(null)

  useEffect(() => {
    if (deliverablePlanning) {
      const { index } = deliverablePlanning.getAssignment()
      const [ass] = getValueByYPath<EleBlock>(deliverablePlanning.yRoot, `meta.core/assignment[${index}]`)

      if (ass) {
        setPublishTime((prev) => (ass.data.publish !== prev) ? ass.data.publish : prev)
      }
    }
  }, [deliverablePlanning])

  // Callback to set correct withheld time to the assignment
  const onBeforeStatusChange = useCallback((newStatus: string, data?: Record<string, unknown>) => {
    if (!deliverablePlanning) {
      toast.error('Kunde inte ändra status på flash! Det gick inte att hitta en kopplad planering.')
      return false
    }

    if (newStatus !== 'withheld') {
      return true
    }

    const { index } = deliverablePlanning.getAssignment()
    if (index < 0) {
      toast.error('Kunde inte schemalägga flash! Det gick inte att hitta ett kopplat uppdrag i planeringen.')
      return false
    }

    if (!(data?.time instanceof Date)) {
      toast.error('Kunde inte schemalägga flash! Tid eller datum är felaktigt angivet.')
      return false
    }

    setValueByYPath(deliverablePlanning.yRoot, `meta.core/assignment[${index}].data.publish`, data.time.toISOString())
    return true
  }, [deliverablePlanning])

  return !!deliverablePlanning && props.id && (
    <StatusMenu
      documentId={props.id}
      type='core/article' // same workflow as article?
      publishTime={publishTime ? new Date(publishTime) : undefined}
      onBeforeStatusChange={onBeforeStatusChange}
    />
  )
}
