import {
  Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger
} from '@ttab/elephant-ui'
import type * as Y from 'yjs'

import React, { type PropsWithChildren, useState } from 'react'
import { useKeydownGlobal } from '@/hooks/useKeydownGlobal'
import { createDocument } from '@/lib/createYItem'
import * as Views from '@/views'
import * as Templates from '@/defaults/templates'
import { type View } from '@/types/index'
import { type Document } from '@ttab/elephant-api/newsdoc'
import { type TemplatePayload } from '@/lib/createYItem'

export type Template = keyof typeof Templates

export const CreateDocumentDialog = ({ type, payload, createdDocumentIdRef, children }: PropsWithChildren<{
  type: View
  payload?: TemplatePayload
  createdDocumentIdRef?: React.MutableRefObject<string | undefined>
}>): JSX.Element | null => {
  const [document, setDocument] = useState<[string | undefined, Y.Doc | undefined]>([undefined, undefined])

  useKeydownGlobal((evt) => {
    if (evt.key === 'Escape') {
      setDocument([undefined, undefined])
    }
  })

  const Document = type && Views[type]

  return (
    <Dialog open={!!document[0]}>
      <DialogTrigger asChild>
        {React.isValidElement<{
          onClick?: (event: React.MouseEvent<HTMLElement>) => void
        }>(children)
        && React.cloneElement(children, {
          onClick: (event: React.MouseEvent<HTMLElement>) => {
            event.preventDefault()
            if (type) {
              setDocument(
                createDocument(
                  getTemplate(type),
                  true,
                  payload,
                  createdDocumentIdRef
                )
              )
            }
          }
        })}
      </DialogTrigger>
      <DialogDescription />
      <DialogTitle />
      <DialogContent
        className='p-0 outline-none'
      >
        {document !== null && Document
        && (
          <Document
            id={document[0]}
            document={document[1]}
            className='p-0 rounded-md'
            asDialog
            onDialogClose={() => {
              setDocument([undefined, undefined])
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function getTemplate(type: View): (id: string) => Document {
  switch (type) {
    case 'Planning':
      return Templates.planning
    case 'Event':
      return Templates.event
    default:
      throw new Error(`No template for ${type}`)
  }
}
