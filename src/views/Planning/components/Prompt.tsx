import { useKeydownGlobal } from '@/hooks/useKeydownGlobal'
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@ttab/elephant-ui'
import type { MouseEvent } from 'react'

export const Prompt = ({ title, description, primaryLabel, secondaryLabel, onPrimary, onSecondary }: {
  title?: string
  description: string
  primaryLabel: string
  secondaryLabel?: string
  onPrimary: (event: MouseEvent<HTMLButtonElement>) => void
  onSecondary?: (event: MouseEvent<HTMLButtonElement> | KeyboardEvent) => void
}): JSX.Element => {
  useKeydownGlobal((event) => {
    if (event.key === 'Escape' && secondaryLabel && onSecondary) {
      onSecondary(event)
    }
  })

  return (
    <Dialog open={true}>
      <DialogContent>
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

          <Button onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onPrimary(event)
          }}
          >
            {primaryLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
