import {
  HocuspocusProvider,
  type HocuspocusProviderConfiguration,
  type HocuspocusProviderWebsocketConfiguration
} from '@hocuspocus/provider'
import { type Hocuspocus } from '@hocuspocus/server'
import { newHocuspocusProviderWebsocket } from './newHocuspocusProviderWebsocket.js'
import type * as Y from 'yjs'

export const newHocuspocusProvider = (
  server: Hocuspocus,
  document: Y.Doc,
  options: Partial<HocuspocusProviderConfiguration> = {},
  websocketOptions: Partial<HocuspocusProviderWebsocketConfiguration> = {}
): HocuspocusProvider => {
  return new HocuspocusProvider({
    websocketProvider: newHocuspocusProviderWebsocket(server, websocketOptions),
    document,
    // Just use a generic document name for all tests.
    name: 'hocuspocus-test',
    // Add or overwrite settings, depending on the test case.
    ...options
  })
}
