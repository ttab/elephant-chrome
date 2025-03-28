import { useDocumentStatus, useView } from '@/hooks'
import { useEffect, useRef } from 'react'
import { StatusMenu } from '@/components/DocumentStatus/StatusMenu'
import { ViewHeader } from '@/components/View'
import { GanttChartSquare } from '@ttab/elephant-ui/icons'
import { MetaSheet } from '@/views/Editor/components/MetaSheet'

export const PlanningHeader = ({ documentId, asDialog, onDialogClose }: {
  documentId: string
  asDialog: boolean
  onDialogClose?: () => void
}): JSX.Element => {
  const { viewId } = useView()
  const [documentStatus, setDocumentStatus] = useDocumentStatus(documentId)

  const containerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    containerRef.current = (document.getElementById(viewId))
  }, [viewId])

  return (
    <ViewHeader.Root asDialog={asDialog}>
      <ViewHeader.Title
        name='Plannings'
        title={(!asDialog) ? 'Planering' : 'Skapa ny planering'}
        icon={GanttChartSquare}
        asDialog={asDialog}
      />

      <ViewHeader.Content className='justify-start'>
        <div className='max-w-[780px] mx-auto flex flex-row gap-1 justify-between items-center w-full'>
          <div className='flex flex-row gap-2 justify-start items-center @6xl/view:-ml-20'>
          </div>

          <div className='flex flex-row gap-2 justify-end items-center'>
            {!asDialog && (
              <StatusMenu type='core/planning-item' status={documentStatus} setStatus={(status) => { void setDocumentStatus(status) }} />
            )}

            {!!documentId && <ViewHeader.RemoteUsers documentId={documentId} />}
          </div>
        </div>
      </ViewHeader.Content>

      <ViewHeader.Action onDialogClose={onDialogClose}>
        {!asDialog && <MetaSheet container={containerRef.current} documentId={documentId} />}
      </ViewHeader.Action>
    </ViewHeader.Root>
  )
}
