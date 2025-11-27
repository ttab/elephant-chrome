import type { HocuspocusProvider } from '@hocuspocus/provider'
import type * as Y from 'yjs'

export const handleRootChange = (value: boolean, provider: HocuspocusProvider | undefined) => {
  const root = provider?.document.getMap('ele').get('root') as Y.Map<unknown>
  const changed = root.get('changed') as boolean
  if (changed !== value) {
    root.set('changed', value)
  }
}
