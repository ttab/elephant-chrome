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
import { type MouseEvent, type PropsWithChildren } from 'react'

export const CreatePrompt = ({
  title,
  description,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  children
}: {
  title?: string
  description: string
  primaryLabel: string
  secondaryLabel?: string
  onPrimary: () => void
  onSecondary?: (event: MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement> | KeyboardEvent) => void
  planningTitle?: string
} & PropsWithChildren): JSX.Element => {
  useKeydownGlobal((event) => {
    if (event.key === 'Escape' && secondaryLabel && onSecondary) {
      onSecondary(event as unknown as React.KeyboardEvent<HTMLButtonElement>)
    }
  })

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

        {children}
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
            onClick={onPrimary}
            onKeyDown={(event: React.KeyboardEvent<HTMLButtonElement>) => {
              if (event.key === 'Enter') {
                onPrimary()
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
