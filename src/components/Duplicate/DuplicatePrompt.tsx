import { useKeydownGlobal } from '@/hooks/useKeydownGlobal'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle
} from '@ttab/elephant-ui'
import { useMemo, type MouseEvent, type JSX } from 'react'
import { fromYjsNewsDoc, toYjsNewsDoc } from '@/shared/transformations/yjsNewsDoc'
import { fromGroupedNewsDoc, toGroupedNewsDoc } from '@/shared/transformations/groupedNewsDoc'
import { Block, type Document } from '@ttab/elephant-api/newsdoc'
import * as Y from 'yjs'
import { format } from 'date-fns'
import { getDateTimeBoundaries } from '@/shared/datetime'
import { useTranslation } from 'react-i18next'

export const DuplicatePrompt = ({
  provider,
  duplicateDate,
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
  onPrimary: (duplicateId: string | undefined, duplicatedDocument: Document) => void
  onSecondary?: (event: MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement> | KeyboardEvent) => void
  provider?: HocuspocusProvider
  duplicateDate: { from: Date, to?: Date | undefined }
  type: 'Planning' | 'Event'
}): JSX.Element => {
  useKeydownGlobal((event) => {
    if (event.key === 'Escape' && secondaryLabel && onSecondary) {
      onSecondary(event as unknown as React.KeyboardEvent<HTMLButtonElement>)
    }
  })

  const { t } = useTranslation()

  function mergeDateWithTime(date1ISO: string | undefined, date2ISO: string | undefined) {
    if (!date1ISO || !date2ISO) {
      return ''
    }

    const [, originalTime] = date1ISO.split('T')
    const [newDate] = date2ISO.split('T')
    return `${newDate}T${originalTime}`
  }

  const payload = useMemo(() => {
    const documentId = crypto.randomUUID()
    const yDoc = new Y.Doc()


    if (provider) {
      const newsdoc = fromGroupedNewsDoc(fromYjsNewsDoc(provider.document))
      const originalUuid = newsdoc.document.uuid
      newsdoc.document.uuid = documentId
      newsdoc.document.uri = `core://${type.toLowerCase()}/${documentId}`

      if (type === 'Event') {
        const eventBlock = newsdoc.document.meta.find((block) => block.type === 'core/event')
        if (eventBlock && eventBlock.data) {
          const { dateGranularity } = eventBlock.data
          let start, end

          if (dateGranularity === 'date') {
            start = getDateTimeBoundaries(duplicateDate.from).startTime.toISOString()
            if (duplicateDate?.to) {
              end = getDateTimeBoundaries(duplicateDate?.to).endTime.toISOString()
            }
          } else {
            start = mergeDateWithTime(eventBlock.data.start, duplicateDate.from.toISOString())
            end = mergeDateWithTime(eventBlock.data.end, duplicateDate.to?.toISOString())
          }

          const newEventBlock = Block.create({
            type: 'core/event',
            data: {
              ...eventBlock.data,
              start,
              end: end || start
            }
          })

          newsdoc.document.meta = newsdoc.document.meta.filter((block) => block.type !== 'core/event')
          newsdoc.document.meta.push(newEventBlock)
        }
      }

      if (type === 'Planning') {
        const planningData: Block | undefined = newsdoc.document.meta.find((block) => block.type === 'core/planning-item')
        const start_date = format(duplicateDate.from, 'yyyy-MM-dd')
        const end_date = format(duplicateDate.to || duplicateDate.from, 'yyyy-MM-dd')

        const newPlanningData = Block.create({
          type: 'core/planning-item',
          data: {
            ...planningData?.data,
            start_date,
            end_date
          }
        })

        // Copied planning items should be clean, as for assignments and authors
        newsdoc.document.meta = newsdoc.document.meta.filter((block) => !['core/planning-item', 'core/assignment', 'core/author'].includes(block.type))
        newsdoc.document.meta.push(newPlanningData)
      }

      const copyGroup = newsdoc.document.meta.find((block) => block.type === 'core/copy-group')

      // Use original document uuid as identifier for copy-groups...
      if (!copyGroup) {
        newsdoc.document.meta.push(Block.create({
          type: 'core/copy-group',
          uuid: originalUuid
        }))
        // ...or preserve already existing id if exists
      }

      newsdoc.version = 0n // Should the new version be 0? Or inherit old version number?

      toYjsNewsDoc(
        toGroupedNewsDoc(newsdoc),
        yDoc
      )


      return { documentId, initialDocument: newsdoc.document }
    }

    throw new Error('no provider')
  }, [provider, type, duplicateDate])

  const { documentId: duplicateId, initialDocument: duplicatedDocument } = payload

  return (
    <Dialog open={true}>
      <DialogContent
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <DialogTitle>{t('shared:copy.copyType', { type: type === 'Planning' ? t('core:documentType.planning') : t('core:documentType.event') })}</DialogTitle>

        <DialogDescription>{description}</DialogDescription>

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
            disabled={!duplicateId || !duplicatedDocument}
            onClick={() => {
              onPrimary(duplicateId, duplicatedDocument)
            }}
            onKeyDown={(event: React.KeyboardEvent<HTMLButtonElement>) => {
              if (event.key === 'Enter') {
                onPrimary(duplicateId, duplicatedDocument)
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
