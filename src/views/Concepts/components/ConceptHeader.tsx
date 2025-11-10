import { useView } from '@/hooks'
import { useEffect, useRef } from 'react'
import { ViewHeader } from '@/components/View'
import { PenIcon } from '@ttab/elephant-ui/icons'
import { MetaSheet } from '../../Editor/components/MetaSheet'
import { StatusMenu } from '@/components/DocumentStatus/StatusMenu'

export const ConceptHeader = ({ documentId, asDialog, onDialogClose, isChanged, type }: {
  documentId: string
  asDialog: boolean
  onDialogClose?: () => void
  isChanged?: boolean
  type: string
}): JSX.Element => {
  const { viewId } = useView()
  const containerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    containerRef.current = document.getElementById(viewId)
  }, [viewId])

  return (
    <ViewHeader.Root asDialog={asDialog}>
      <ViewHeader.Title
        name={type}
        title={type}
        icon={PenIcon}
        asDialog={asDialog}
      />
      <ViewHeader.Content className='justify-start'>
        <div className='max-w-[780px] mx-auto flex flex-row gap-1 justify-between items-center w-full'>
          <div className='flex flex-row gap-2 justify-start items-center @6xl/view:-ml-20'>
          </div>

          <div className='flex flex-row gap-2 justify-end items-center'>
            {!asDialog && (
              <>
                <StatusMenu
                  documentId={documentId}
                  type='core/section' // TODO need to change this to dynamic value depending on concept type
                  isChanged={isChanged}
                />
                <MetaSheet container={containerRef.current} documentId={documentId} />
              </>
            )}
            {!!documentId && <ViewHeader.RemoteUsers documentId={documentId} />}
          </div>
        </div>
      </ViewHeader.Content>
      <ViewHeader.Action onDialogClose={onDialogClose} asDialog={asDialog} />
    </ViewHeader.Root>
  )
}
