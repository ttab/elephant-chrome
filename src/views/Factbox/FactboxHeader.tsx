import { useView } from '@/hooks'
import { useEffect, useRef, type JSX } from 'react'
import { StatusMenu } from '@/components/DocumentStatus/StatusMenu'
import { ViewHeader } from '@/components/View'
import { BookTextIcon } from '@ttab/elephant-ui/icons'
import { MetaSheet } from '@/components/MetaSheet/MetaSheet'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'

export const FactboxHeader = ({ ydoc, asDialog, onDialogClose }: {
  ydoc: YDocument<Y.Map<unknown>>
  asDialog: boolean
  onDialogClose?: () => void
}): JSX.Element => {
  const { viewId } = useView()
  const containerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    containerRef.current = (document.getElementById(viewId))
  }, [viewId])

  return (
    <ViewHeader.Root asDialog={asDialog}>
      <ViewHeader.Title
        name='Factbox'
        title='Faktaruta'
        icon={BookTextIcon}
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
                  type='core/factbox'
                />
                <MetaSheet container={containerRef.current} ydoc={ydoc} />
              </>
            )}
            {!!ydoc && <ViewHeader.RemoteUsers ydoc={ydoc} />}
          </div>
        </div>
      </ViewHeader.Content>
      <ViewHeader.Action onDialogClose={onDialogClose} asDialog={asDialog} />

    </ViewHeader.Root>
  )
}
