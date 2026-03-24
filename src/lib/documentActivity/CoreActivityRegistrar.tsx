import { useMemo } from 'react'
import { useRegisterDocumentActivity } from './useRegisterDocumentActivity'
import type { ActivityDefinition } from './types'

const articleOpen: ActivityDefinition = {
  title: 'Open in editor',
  viewRouteFunc: (docId) => Promise.resolve({
    viewName: 'Editor',
    props: { id: docId }
  })
}

const flashOpen: ActivityDefinition = {
  title: 'Open flash',
  viewRouteFunc: (docId) => Promise.resolve({
    viewName: 'Flash',
    props: { id: docId }
  })
}

const planningOpen: ActivityDefinition = {
  title: 'Open planning',
  viewRouteFunc: (docId) => Promise.resolve({
    viewName: 'Planning',
    props: { id: docId }
  })
}

const eventOpen: ActivityDefinition = {
  title: 'Open event',
  viewRouteFunc: (docId) => Promise.resolve({
    viewName: 'Event',
    props: { id: docId }
  })
}

const factboxOpen: ActivityDefinition = {
  title: 'Open factbox',
  viewRouteFunc: (docId) => Promise.resolve({
    viewName: 'Factbox',
    props: { id: docId }
  })
}

export const CoreActivityRegistrar = (): null => {
  const articleOpenPlanning = useMemo<ActivityDefinition>(() => ({
    title: 'Open planning',
    viewRouteFunc: (_docId, args) => {
      const planningId = args?.planningId as string | undefined

      if (!planningId) {
        return Promise.reject(new Error('No planning ID provided'))
      }

      return Promise.resolve({
        viewName: 'Planning',
        props: { id: planningId }
      })
    }
  }), [])

  useRegisterDocumentActivity('core/article', 'open', articleOpen)
  useRegisterDocumentActivity('core/flash', 'open', flashOpen)
  useRegisterDocumentActivity('core/planning-item', 'open', planningOpen)
  useRegisterDocumentActivity('core/event', 'open', eventOpen)
  useRegisterDocumentActivity('core/factbox', 'open', factboxOpen)
  useRegisterDocumentActivity('core/article', 'open-planning', articleOpenPlanning)

  return null
}
