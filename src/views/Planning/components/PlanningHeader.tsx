import { useView } from '@/hooks'
import { useRef, useEffect, type JSX } from 'react'
import { StatusMenu } from '@/components/DocumentStatus/StatusMenu'
import { ViewHeader } from '@/components/View'
import { GanttChartSquareIcon } from '@ttab/elephant-ui/icons'
import { MetaSheet } from '@/components/MetaSheet/MetaSheet'
import { Duplicate } from '@/components/Duplicate'
import type { PlanningData } from '@/types/index'
import type { Session } from 'next-auth'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import { useYValue, type YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
import { useTranslation } from 'react-i18next'

export const PlanningHeader = ({ ydoc, asDialog, onDialogClose, session, provider, status }: {
  ydoc: YDocument<Y.Map<unknown>>
  asDialog: boolean
  onDialogClose?: () => void
  session: Session | null
  provider: HocuspocusProvider | null
  status: 'authenticated' | 'loading' | 'unauthenticated'

}): JSX.Element => {
  const { viewId } = useView()
  const containerRef = useRef<HTMLElement | null>(null)
  const [planningData] = useYValue<PlanningData>(ydoc.ele, 'meta.core/planning-item[0].data')
  const [planningTitle] = useYValue<string>(ydoc.ele, 'root.title')
  const { t } = useTranslation()

  useEffect(() => {
    containerRef.current = (document.getElementById(viewId))
  }, [viewId])

  return (
    <ViewHeader.Root asDialog={asDialog}>
      <ViewHeader.Title
        name='Plannings'
        title={(!asDialog) ? t('views.plannings.label.singular') : 'Skapa ny planering'}
        icon={GanttChartSquareIcon}
        asDialog={asDialog}
        ydoc={ydoc}
      />

      <ViewHeader.Content className='justify-start'>
        <div className='max-w-[780px] mx-auto flex flex-row gap-1 justify-between items-center w-full'>
          <div className='flex flex-row gap-2 justify-start items-center @6xl/view:-ml-20'>
          </div>

          <div className='flex flex-row gap-2 justify-end items-center'>
            {!asDialog && ydoc && (
              <StatusMenu
                ydoc={ydoc}
              />
            )}

            {!!ydoc && <ViewHeader.RemoteUsers ydoc={ydoc} />}
          </div>
        </div>
        {!asDialog && provider && planningData && (
          <Duplicate
            title={planningTitle}
            provider={provider}
            session={session}
            status={status}
            type='Planning'
            dataInfo={planningData}
          />
        )}
      </ViewHeader.Content>

      <ViewHeader.Action ydoc={ydoc} onDialogClose={onDialogClose} asDialog={asDialog}>
        {!asDialog && ydoc && (
          <MetaSheet container={containerRef.current} ydoc={ydoc} />
        )}
      </ViewHeader.Action>
    </ViewHeader.Root>
  )
}
