import { useKeydownGlobal } from '@/hooks/useKeydownGlobal'
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@ttab/elephant-ui'
import type { MouseEvent } from 'react'

export const Prompt = ({ title, description, primaryLabel, secondaryLabel, onPrimary, onSecondary }: {
  title?: string
  description: string
  primaryLabel: string
  secondaryLabel?: string
  onPrimary: (event: MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement> | KeyboardEvent) => void
  onSecondary?: (event: MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement> | KeyboardEvent) => void
}): JSX.Element => {
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
