import { useCollaborationDocument } from '@/hooks/useCollaborationDocument'
import { useKeydownGlobal } from '@/hooks/useKeydownGlobal'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@ttab/elephant-ui'
import { useMemo, type MouseEvent } from 'react'
import { fromYjsNewsDoc, toYjsNewsDoc } from '@/shared/transformations/yjsNewsDoc'
import { fromGroupedNewsDoc, toGroupedNewsDoc } from '@/shared/transformations/groupedNewsDoc'
import { Block } from '@ttab/elephant-api/newsdoc'
import * as Y from 'yjs'

export const DuplicatePrompt = ({
  provider,
  duplicateDate,
  title,
  description,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  type
}: {
  title?: string
  description: string
  primaryLabel: string
  secondaryLabel?: string
  onPrimary: (duplicateId: string | undefined) => void
  onSecondary?: (event: MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement> | KeyboardEvent) => void
  provider?: HocuspocusProvider
  duplicateDate: Date
  type: string
}): JSX.Element => {
  useKeydownGlobal((event) => {
    if (event.key === 'Escape' && secondaryLabel && onSecondary) {
      onSecondary(event as unknown as React.KeyboardEvent<HTMLButtonElement>)
    }
  })

  function mergeDateWithTime(date1ISO: string | undefined, date2ISO: string | undefined) {
    if (!date1ISO || !date2ISO) {
      return ''
    }

    const [, originalTime] = date1ISO.split('T')
    const [newDate] = date2ISO.split('T')
    return `${newDate}T${originalTime}`
  }

  const collaborationPayload = useMemo(() => {
    const documentId = crypto.randomUUID()
    const yDoc = new Y.Doc()

    if (provider) {
      const newsdoc = fromGroupedNewsDoc(fromYjsNewsDoc(provider.document).documentResponse)
      const originalUuid = newsdoc.document.uuid
      newsdoc.document.uuid = documentId
      newsdoc.document.uri = `core://${type}/${documentId}`
      const eventBlock = newsdoc.document.meta.find((block) => block.type === 'core/event')

      if (eventBlock) {
        const newEventBlock = Block.create({
          type: 'core/event',
          data: {
            ...eventBlock.data,
            start: mergeDateWithTime(eventBlock?.data?.start, duplicateDate.toISOString()),
            end: mergeDateWithTime(eventBlock?.data?.end, duplicateDate.toISOString())
          }
        })

        newsdoc.document.meta = newsdoc.document.meta.filter((block) => block.type !== 'core/event')
        newsdoc.document.meta.push(newEventBlock)

        const copyGroup = newsdoc.document.meta.find((block) => block.type === 'core/copy-group')

        // Use original document uuid as identifier for copy-groups...
        if (!copyGroup) {
          newsdoc.document.meta.push(Block.create({
            type: 'core/copy-group',
            uuid: originalUuid
          }))
          // ...or preserve already existing id if exists
        }
      }

      newsdoc.version = 0n // Should the new version be 0? Or inherit old version number?

      toYjsNewsDoc(
        toGroupedNewsDoc(newsdoc),
        yDoc
      )
      return { documentId, initialDocument: yDoc }
    }

    throw new Error('no provider')
  }, [provider, type, duplicateDate])

  const { documentId: duplicateId } = useCollaborationDocument(collaborationPayload)

  return (
    <Dialog open={true}>
      <DialogContent
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <DialogHeader>
          {!!title && <DialogTitle>{title}</DialogTitle>}
        </DialogHeader>

        <DialogDescription>
          {description}
        </DialogDescription>

        <DialogFooter className='flex flex-col gap-2 pt-4'>
          {!!onSecondary && !!secondaryLabel && (
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
              onPrimary(duplicateId)
            }}
            onKeyDown={(event: React.KeyboardEvent<HTMLButtonElement>) => {
              if (event.key === 'Enter') {
                onPrimary(duplicateId)
              }
            }}
          >
            {primaryLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
