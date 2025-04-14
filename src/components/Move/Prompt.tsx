import { useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button } from '@ttab/elephant-ui'
import { createDocument } from '@/lib/createYItem'
import type { DefaultValueOption } from '@ttab/elephant-ui'
import * as Templates from '@/defaults/templates'
import { useKeydownGlobal } from '@/hooks/useKeydownGlobal'
import { useCollaborationDocument } from '@/hooks/useCollaborationDocument'
import type * as Y from 'yjs'
import { createStateless, StatelessType } from '@/shared/stateless'
import { useSession } from 'next-auth/react'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import { toast } from 'sonner'

export const MovePrompt = ({
  title,
  description,
  onPrimary,
  onSecondary,
  primaryLabel,
  secondaryLabel,
  selectedPlanning,
  payload
}: {
  title: string
  description: string
  onPrimary: (
    planning: Y.Doc | undefined,
    provider?: HocuspocusProvider
  ) => void
  onSecondary?: () => void
  primaryLabel?: string
  secondaryLabel?: string
  selectedPlanning?: DefaultValueOption | undefined
  payload: Templates.TemplatePayload | undefined
}): JSX.Element => {
  const { data: session, status } = useSession()
  useKeydownGlobal((event) => {
    if (event.key === 'Escape' && secondaryLabel && onSecondary) {
      onSecondary()
    }
  })

  // If we have a selected planning, use that to create a collaboration document
  // Otherwise, create a new planning document
  const collaborationPayload = useMemo(() => {
    if (selectedPlanning?.value) {
      return { documentId: selectedPlanning.value }
    }

    const [documentId, initialDocument] = createDocument({
      template: Templates.planning,
      inProgress: true,
      payload: { ...payload, title: `${payload?.title} - (flyttad)` }
    })

    return { documentId, initialDocument }
  }, [selectedPlanning, payload])

  const { document: planning, documentId: planningId, provider } = useCollaborationDocument(collaborationPayload)

  const handlePrimaryClick = () => {
    if (status !== 'authenticated' || !session || !provider?.synced) {
      toast.error('Uppdraget kunde inte flyttas. Du är inte inloggad.')
      return
    }

    if (!planning) {
      toast.error('Uppdraget kunde inte flyttas. Var god försök igen.')
      onSecondary?.()
      return
    }

    onPrimary(planning)

    if (!selectedPlanning && provider?.synced && session) {
      provider.sendStateless(
        createStateless(StatelessType.IN_PROGRESS, {
          state: false,
          id: planningId,
          context: {
            accessToken: session.accessToken,
            user: session.user,
            type: 'Planning'
          }
        })
      )
    }
  }

  const handlePrimaryKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter') {
      onPrimary(planning)
    }
  }

  return (
    <Dialog open={true}>
      <DialogContent
        onOpenAutoFocus={(event) => event.preventDefault()}
        onPointerDownOutside={() => {
          if (onSecondary) {
            onSecondary()
          }
        }}
      >
        <DialogHeader>
          {title && <DialogTitle>{title}</DialogTitle>}
        </DialogHeader>

        <DialogDescription>{description}</DialogDescription>

        <DialogFooter className='flex flex-col gap-2 pt-4'>
          {onSecondary && secondaryLabel && (
            <Button
              variant='secondary'
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onSecondary()
              }}
            >
              {secondaryLabel}
            </Button>
          )}

          <Button autoFocus onClick={handlePrimaryClick} onKeyDown={handlePrimaryKeyDown}>
            {primaryLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
