import {
  Dialog, DialogContent, DialogTrigger
} from '@ttab/elephant-ui'
import type * as Y from 'yjs'

import React, { type PropsWithChildren, useState } from 'react'
import { useKeydownGlobal } from '@/hooks/useKeydownGlobal'
import { createDocument } from '@/lib/createYItem'
import * as Views from '@/views'
import * as templates from '@/lib/templates'
import { type View } from '@/types/index'
import { type Document } from '@/protos/service'
import { type TemplatePayload } from '@/lib/createYItem'

export type Template = keyof typeof templates

export const CreateDocumentDialog = ({ type, payload, children, mutator }: PropsWithChildren<{
  type: View
  payload?: TemplatePayload
  mutator?: (id: string, title: string) => Promise<void>
}>): JSX.Element | null => {
  const [document, setDocument] = useState<[string | undefined, Y.Doc | undefined]>([undefined, undefined])

  useKeydownGlobal(evt => {
    if (evt.key === 'Escape') {
      setDocument([undefined, undefined])
    }
  })

  const Document = type && Views[type]

  return (
    <Dialog open={!!document[0]} >
      <DialogTrigger asChild>
        {React.isValidElement<{
          onClick?: (event: React.MouseEvent<HTMLElement>) => Promise<void>
        }>(children) &&
          React.cloneElement(children, {
            onClick: async (event: React.MouseEvent<HTMLElement>) => {
              event.preventDefault()
              if (type) {
                setDocument(
                  createDocument(
                    getTemplate(type), true, payload
                  )
                )
              }
            }
          })}
      </DialogTrigger>

      <DialogContent className='p-0 rounded-md'>
        {document !== null && Document &&
          <Document
            id={document[0]}
            document={document[1]}
            className='p-0 rounded-md'
            asCreateDialog
            onDialogClose={(id, title: string = 'Untitled') => {
              setDocument([undefined, undefined])

              if (id && mutator) {
                mutator(id, title).catch((error: unknown) => {
                  if (error instanceof Error) {
                    throw new Error(`Error when mutating Planning list: ${error.message}`)
                  }
                })
              }
            }}
          />
        }
      </DialogContent>
    </Dialog>
  )
}

function getTemplate(type: View): (id: string) => Document {
  switch (type) {
    case 'Planning':
      return templates.planning
    case 'Event':
      return templates.event
    default:
      throw new Error(`No template for ${type}`)
  }
}
