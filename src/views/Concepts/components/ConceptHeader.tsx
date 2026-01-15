import { useView } from '@/hooks'
import { type JSX, useEffect, useRef } from 'react'
import { ViewHeader } from '@/components/View'
import { PenIcon } from '@ttab/elephant-ui/icons'
import { StatusMenu } from '@/components/DocumentStatus/StatusMenu'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
import { MetaSheet } from '@/components/MetaSheet/MetaSheet'


export const ConceptHeader = ({ ydoc, asDialog, onDialogClose, type, documentType }: {
  ydoc: YDocument<Y.Map<unknown>>
  asDialog: boolean
  onDialogClose?: () => void
  type: string
  documentType: string
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
                  ydoc={ydoc}
                  type={documentType}
                />
                <MetaSheet container={containerRef.current} ydoc={ydoc} />
              </>
            )}
            {!!ydoc.id && <ViewHeader.RemoteUsers ydoc={ydoc} />}
          </div>
        </div>
      </ViewHeader.Content>
      <ViewHeader.Action ydoc={ydoc} onDialogClose={onDialogClose} asDialog={asDialog} />
    </ViewHeader.Root>
  )
}
