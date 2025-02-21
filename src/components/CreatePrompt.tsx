import { useKeydownGlobal } from '@/hooks/useKeydownGlobal'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@ttab/elephant-ui'
import { useMemo, type MouseEvent, type PropsWithChildren } from 'react'
import type { DefaultValueOption } from '../types'
import { useCollaborationDocument } from '@/hooks/useCollaborationDocument'
import { createDocument } from '@/lib/createYItem'
import * as Templates from '@/defaults/templates'
import type * as Y from 'yjs'

export const CreatePrompt = ({
  title,
  description,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  selectedPlanning,
  planningTitle,
  children,
  payload
}: {
  title?: string
  description: string
  primaryLabel: string
  secondaryLabel?: string
  onPrimary: (
    planning: Y.Doc | undefined,
    planningId: string | undefined,
    planningTitle: string | undefined,
    hasSelectedPlanning: boolean) => void
  onSecondary?: (event: MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement> | KeyboardEvent) => void
  selectedPlanning: DefaultValueOption | undefined
  planningTitle?: string
  payload?: Templates.TemplatePayload
} & PropsWithChildren): JSX.Element => {
  useKeydownGlobal((event) => {
    if (event.key === 'Escape' && secondaryLabel && onSecondary) {
      onSecondary(event as unknown as React.KeyboardEvent<HTMLButtonElement>)
    }
  })


  // If we have a selected planning, use that to create a collaboration document
  // Otherwise, create a new planning document
  const collaborationPayload = useMemo(() => {
    if (!selectedPlanning?.value) {
      const [documentId, initialDocument] = createDocument({
        template: Templates.planning,
        inProgress: true,
        payload
      })
      return { documentId, initialDocument }
    } else {
      return { documentId: selectedPlanning?.value }
    }
  }, [selectedPlanning, payload])

  const { document: planning, documentId: planningId } = useCollaborationDocument(collaborationPayload)

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

        {children}
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
              onPrimary(planning, planningId, planningTitle, !!selectedPlanning?.value)
            }}
            onKeyDown={(event: React.KeyboardEvent<HTMLButtonElement>) => {
              if (event.key === 'Enter') {
                onPrimary(planning, planningId, planningTitle, !!selectedPlanning?.value)
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
