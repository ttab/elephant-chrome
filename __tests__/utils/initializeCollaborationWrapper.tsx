import React from 'react'
import { CollaborationContext } from '@/contexts/CollaborationProvider'
import { newHocuspocusProvider } from './newHocuspocusProvider'
import { newHocuspocus } from './newHocuspocus'
import { newsDocToYDoc } from '../../src-srv/utils/transformations/yjs/yDoc'
import { planning } from '../data/planning-newsdoc'
import * as Y from 'yjs'

const yDoc = new Y.Doc()
newsDocToYDoc(yDoc, planning)

export const initializeCollaborationWrapper = async (): Promise<(props: React.PropsWithChildren) => JSX.Element> => {
  const server = await newHocuspocus({})
  const provider = newHocuspocusProvider(server, yDoc)

  const mockCollaborationContext = {
    provider,
    documentId: 'abc',
    connected: true,
    synced: true,
    user: {
      name: 'Name Name',
      initials: 'NN',
      color: 'red'
    }
  }

  const wrapper = (props: React.PropsWithChildren): JSX.Element => (
    <CollaborationContext.Provider value={{ ...mockCollaborationContext }}>
      {props.children}
    </CollaborationContext.Provider>
  )

  return wrapper
}

