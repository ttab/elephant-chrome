import { useCollaborationDocument } from '@/hooks/useCollaborationDocument'
import { useKeydownGlobal } from '@/hooks/useKeydownGlobal'
import { createDocument } from '@/lib/createYItem'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@ttab/elephant-ui'
import { useMemo, type MouseEvent } from 'react'
import * as Templates from '@/defaults/templates'
import { useSession } from 'next-auth/react'
import type * as Y from 'yjs'

export const Prompt = ({ provider, duplicateDate, title, description, primaryLabel, secondaryLabel, onPrimary, onSecondary }: {
  title?: string
  description: string
  primaryLabel: string
  secondaryLabel?: string
  onPrimary: (dupDoc: Y.Doc | undefined, dupId: string | undefined) => void
  onSecondary?: (event: MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement> | KeyboardEvent) => void
  provider?: HocuspocusProvider
  duplicateDate: Date
}): JSX.Element => {
  useKeydownGlobal((event) => {
    if (event.key === 'Escape' && secondaryLabel && onSecondary) {
      onSecondary(event as unknown as React.KeyboardEvent<HTMLButtonElement>)
    }
  })


  const collaborationPayload = useMemo(() => {
    const [documentId, initialDocument] = createDocument({
      template: Templates.duplicate, /* (id, provider?.document, { type: 'event', newDate: duplicateDate.toISOString() }) */
      inProgress: true,
      payload: {
        newDate: duplicateDate.toISOString(),
        document: provider?.document,
        type: 'event'
      }
    })
    return { documentId, initialDocument }
  }, [duplicateDate, provider?.document])

  const { document: dupDoc, documentId: dupId } = useCollaborationDocument(collaborationPayload)

  console.log(dupDoc, dupId)

  return (
    <Dialog open={true}>
      <DialogContent
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <DialogHeader>
          {!!title
          && <DialogTitle>{title}</DialogTitle>}
        </DialogHeader>

        <DialogDescription>
          {description}
        </DialogDescription>

        <DialogFooter className='flex flex-col gap-2 pt-4'>
          {!!onSecondary && !!secondaryLabel
          && (
            <Button
              variant='secondary'
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onSecondary(event)
              }}
            >
              {secondaryLabel}
            </Button>
          )}

          <Button
            autoFocus
            onClick={() => {
              onPrimary(dupDoc, dupId)
            }}
            /* onKeyDown={(event: React.KeyboardEvent<HTMLButtonElement>) => {
              if (event.key === 'Enter') {
                onPrimary(event)
              }
            }} */
          >
            {primaryLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
