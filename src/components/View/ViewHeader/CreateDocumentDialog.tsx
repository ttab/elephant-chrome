import {
  Button,
  Dialog, DialogContent, DialogTrigger
} from '@ttab/elephant-ui'
import type * as Y from 'yjs'

import { PlusIcon } from '@ttab/elephant-ui/icons'
import { useState } from 'react'
import { useKeydownGlobal } from '@/hooks/useKeydownGlobal'
import { createDocument } from '@/lib/createYItem'
import * as Views from '@/views'
import * as templates from '@/lib/templates'
import { type View } from '@/types/index'
import { type Document } from '@/protos/service'

export type Template = keyof typeof templates

// TODO: Remove optional type once Events view is implemented
export const CreateDocumentDialog = ({ type }: { type?: View }): JSX.Element | null => {
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
        <Button size='sm' className='h-8 pr-4' onClick={() => {
          if (type) {
            setDocument(createDocument(getTemplate(type), true))
          }
        }}>
          <PlusIcon size={18} strokeWidth={1.75} /> Ny
        </Button>
      </DialogTrigger>

      <DialogContent className='p-0 rounded-md'>
        {document !== null && Document &&
        <Document
          id={document[0]}
          document={document[1]}
          className='p-0 rounded-md'
          asCreateDialog
          onDialogClose={(id) => {
            setDocument([undefined, undefined])
            if (id) {
              // Open in new view
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
    default:
      return templates.planning
  }
}
