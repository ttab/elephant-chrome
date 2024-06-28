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
    // There is no need to share data with other browser tabs in the testing environment.
    broadcast: false,
    // We don’t need console logging in tests. If we actually do, we can overwrite it anyway.
    quiet: true,
    // Add or overwrite settings, depending on the test case.
    ...options
  })
}
