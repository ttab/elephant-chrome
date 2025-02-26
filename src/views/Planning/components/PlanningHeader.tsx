import { useDocumentStatus, useView } from '@/hooks'
import { useEffect, useRef } from 'react'
import { DocumentStatus } from '@/components/TmpDocumentStatus'
import { ViewHeader } from '@/components/View'
import { GanttChartSquare } from '@ttab/elephant-ui/icons'

export const PlanningHeader = ({ documentId, asDialog }: {
  documentId: string
  asDialog: boolean
}): JSX.Element => {
  const { viewId } = useView()
  const [documentStatus, setDocumentStatus] = useDocumentStatus(documentId)

  const containerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    containerRef.current = (document.getElementById(viewId))
  }, [viewId])

  return (
    <ViewHeader.Root asDialog={asDialog}>
      {!asDialog
        ? <ViewHeader.Title name='Plannings' title='Planering' icon={GanttChartSquare} />
        : <ViewHeader.Title name='Plannings' title='Skapa ny planering' icon={GanttChartSquare} asDialog />}

      <ViewHeader.Content className='justify-start'>
        <div className='max-w-[780px] mx-auto flex flex-row gap-1 justify-between items-center w-full'>
          <div className='flex flex-row gap-2 justify-start items-center @6xl/view:-ml-20'>
          </div>

          <div className='flex flex-row gap-2 justify-end items-center'>
            {!!documentId && <ViewHeader.RemoteUsers documentId={documentId} />}

            {!asDialog && (
              <DocumentStatus status={documentStatus} setStatus={setDocumentStatus} />
            )}
          </div>
        </div>
      </ViewHeader.Content>

      <ViewHeader.Action />
    </ViewHeader.Root>
  )
}
