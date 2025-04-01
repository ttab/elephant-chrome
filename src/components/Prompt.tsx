import type { PropsWithChildren } from 'react'
import { useKeydownGlobal } from '@/hooks/useKeydownGlobal'
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@ttab/elephant-ui'
import type { MouseEvent } from 'react'

interface PromptProps extends PropsWithChildren {
  title?: string
  description?: string
  primaryLabel: string
  secondaryLabel?: string
  onPrimary: (event: MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement> | KeyboardEvent) => void
  onSecondary?: (event: MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement> | KeyboardEvent) => void
  disablePrimary?: boolean
}

export const Prompt = ({
  title,
  description,
  children,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  disablePrimary = false
}: PromptProps): JSX.Element => {
  useKeydownGlobal((event) => {
    if (event.key === 'Escape' && secondaryLabel && onSecondary) {
      onSecondary(event as unknown as React.KeyboardEvent<HTMLButtonElement>)
    }
  })

  return (
    <Dialog open={true}>
      <DialogContent onOpenAutoFocus={(event) => event.preventDefault()}>
        <DialogHeader>
          {!!title && <DialogTitle>{title}</DialogTitle>}
        </DialogHeader>

        <DialogDescription>
          {!!description && description}
        </DialogDescription>

        {!!children && <>{children}</>}

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
            disabled={disablePrimary}
            autoFocus
            onClick={(event: MouseEvent<HTMLButtonElement>) => {
              onPrimary(event)
            }}
            onKeyDown={(event: React.KeyboardEvent<HTMLButtonElement>) => {
              if (event.key === 'Enter') {
                onPrimary(event)
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
