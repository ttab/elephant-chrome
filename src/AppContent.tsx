import React, { useMemo } from 'react'
import { useHistory, useNavigation, useResize } from '@/hooks'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@ttab/elephant-ui'
import { useIndexedDB } from './datastore/hooks/useIndexedDB'
import { calculateViewWidths, minimumSpaceRequired } from '@/navigation/lib'
import type { ContentState, NavigationState, ViewProps } from './types'
import { ViewWrapper } from './components'
import { Navigation } from './views/Wires/components/Navigation'

export const AppContent = (): JSX.Element => {
  const { setActiveView } = useHistory()
  const { state } = useNavigation()
  const IDB = useIndexedDB()
  useResize()

  const { components, content } = useMemo(() => {
    return getVisibleContent(state, setActiveView)
  }, [state, setActiveView])

  const views = useMemo(() => {
    return calculateViewWidths(state.viewRegistry, content)
  }, [state, content])

  return (
    <>
      {components.map((Component, n) => {
        const item = content[n]
        const { colSpan } = views[n]

        // FIXME: This whole thing must be memoized(?), or could we handle colSpan better further down the tree?
        return (
          <ViewWrapper key={item.viewId} viewId={item.viewId} name={item.name} colSpan={colSpan}>
            <Component {...item.props} />
          </ViewWrapper>
        )
      })}

      <Navigation visibleContent={content} />
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
  const content = [...state.content ?? []]
  const components = content.map((c) => state.viewRegistry.get(c.name).component)

  let spaceRequired = minimumSpaceRequired(content, state.viewRegistry)
  if (spaceRequired <= 12) {
    return {
      components,
      content
    }
  }

  // Screen size too small for currently available views, remove overflow
  const isWires = content.every((c) => c.name === 'Wires')
  const newActiveId = content.find((c) => c.viewId === state.active)?.viewId || content[0].viewId

  do {
    // Check if newActiveId is within content after shift
    const shiftedContent = content.slice(1)
    if (!isWires || shiftedContent.some((c) => c.viewId === newActiveId)) {
      components.shift()
      content.shift()
    } else {
      // newActiveId is not within content after shift
      // Perform pop operation
      components.pop()
      content.pop()
    }
    spaceRequired = minimumSpaceRequired(content, state.viewRegistry)
  } while (spaceRequired > 12 && components.length > 1)

  // Get active id, or set it to the leftmost view if the active view did not fit
  const activeId = content.find((c) => c.viewId === state.active)?.viewId || content[0].viewId
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
