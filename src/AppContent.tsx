import { useHistory, useNavigation, useResize } from '@/hooks'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@ttab/elephant-ui'
import { useIndexedDB } from './datastore/hooks/useIndexedDB'
import { calculateViewWidths, minimumSpaceRequired } from './navigation/lib'
import type { ContentState, NavigationState, ViewProps } from './types'
import { ViewWrapper } from './components'

export const AppContent = (): JSX.Element => {
  const { setActiveView } = useHistory()
  const { state } = useNavigation()
  const IDB = useIndexedDB()

  // FIXME: Must trigger rerender when resizing
  const size = useResize()

  const { components, content } = getVisibleContent(state, setActiveView)
  const views = calculateViewWidths(state.viewRegistry, content)

  return (
    <>
      {components.map((Component, n) => {
        const item = content[n]
        const { colSpan } = views[n]

        return (
          <ViewWrapper key={item.viewId} viewId={item.viewId} name={item.name} colSpan={colSpan}>
            <Component {...item.props} />
          </ViewWrapper>
        )
      })}

      <Dialog open={!IDB.db}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Du behöver ladda om fönstret</DialogTitle>
            <DialogDescription>
              Systemet har uppdaterats med nya eller ändrade funktioner.
              Ladda om fönstret för att jobba vidare i den nya versionen.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

    </>
  )
}


function getVisibleContent(state: NavigationState, setActiveView: (viewId: string) => void): {
  components: Array<React.FC<ViewProps>>
  content: ContentState[]
} {
  const components = [...state.components]
  const content = [...state.content]

  let spaceRequired = minimumSpaceRequired(content, state.viewRegistry)
  if (spaceRequired) {
    return {
      components,
      content
    }
  }

  // Screen size too small for currently available views, remove overflow
  do {
    components.shift()
    content.shift()
    spaceRequired = minimumSpaceRequired(content, state.viewRegistry)
  } while (spaceRequired > 12 && components.length > 1)

  // Get active id, or set it to the leftmost view if the active view did not fit
  const activeId = content.find(c => c.viewId === state.active)?.viewId || content[0].viewId
  setTimeout(() => {
    if (activeId !== state.active) {
      setActiveView(activeId)
    }
  }, 0)

  return {
    components,
    content
  }
}
