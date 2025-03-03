import { useCollaborationDocument } from '@/hooks/useCollaborationDocument'
import { useKeydownGlobal } from '@/hooks/useKeydownGlobal'
import { createDocument } from '@/lib/createYItem'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@ttab/elephant-ui'
import { useMemo, type MouseEvent } from 'react'
import * as Templates from '@/defaults/templates'

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


  const collaborationPayload = useMemo(() => {
    if (provider) {
      const [documentId, initialDocument] = createDocument({
        template: Templates.duplicate,
        inProgress: true,
        payload: {
          newDate: duplicateDate.toISOString(),
          document: provider.document,
          type
        }
      })
      return { documentId, initialDocument }
    }
    return { documentId: '' }
  }, [duplicateDate, provider, type])

  const { documentId: duplicateId } = useCollaborationDocument(collaborationPayload)

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
