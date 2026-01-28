import { ViewHeader } from '@/components/View'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
import { StatusMenuLogic } from './StatusMenu' // Import the logic component
import type { DocumentView } from './types'
import { ViewMap } from './types'

export const DocumentHeader = ({
  ydoc,
  readOnly,
  asDialog,
  onDialogClose,
  preview,
  planningId,
  view
}: {
  ydoc: YDocument<Y.Map<unknown>>
  readOnly?: boolean
  asDialog?: boolean
  onDialogClose?: (() => void) | undefined
  preview?: boolean
  planningId?: string | null
  view: DocumentView
}) => {
  const config = ViewMap[view]
  const HeaderIcon = (readOnly && config.readOnlyIcon) ? config.readOnlyIcon : config.icon
  const TitleIcon = config.icon

  return (
    <ViewHeader.Root>
      {!asDialog && (
        <ViewHeader.Title
          name={view}
          title={config.baseTitle}
          icon={HeaderIcon}
          iconColor={config.iconColor}
          preview={preview}
        />
      )}

      <ViewHeader.Content>
        <div className='flex w-full h-full items-center space-x-2 font-bold'>
          {asDialog && (
            <ViewHeader.Title
              name={view}
              title={config.newDialogTitle}
              icon={TitleIcon}
              iconColor={config.iconColor}
            />
          )}
        </div>

        {!asDialog && !!ydoc && !preview && <ViewHeader.RemoteUsers ydoc={ydoc} />}

        {!asDialog && !!ydoc.id && !preview && planningId && (
          <StatusMenuLogic ydoc={ydoc} propPlanningId={planningId} view={view} />
        )}
      </ViewHeader.Content>

      <ViewHeader.Action onDialogClose={onDialogClose} asDialog={asDialog} />
    </ViewHeader.Root>
  )
}
