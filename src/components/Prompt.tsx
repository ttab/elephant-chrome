import type { PropsWithChildren } from 'react'
import { useKeydownGlobal } from '@/hooks/useKeydownGlobal'
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@ttab/elephant-ui'
import type { MouseEvent } from 'react'
import { PromptCauseField } from './DocumentStatus/PromptCauseField'

interface PromptProps extends PropsWithChildren {
  title?: string
  description?: string
  primaryLabel: string
  secondaryLabel?: string
  onPrimary: (event: MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement> | KeyboardEvent) => void
  onSecondary?: () => void
  disablePrimary?: boolean
  currentCause?: { cause: string | undefined, setCause: (value: string) => void }
}

export const Prompt = ({
  title,
  description,
  children,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  disablePrimary = false,
  currentCause
}: PromptProps): JSX.Element => {
  useKeydownGlobal((event) => {
    if (event.key === 'Escape' && secondaryLabel && onSecondary) {
      onSecondary()
    }
  })

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
          {!!title && <DialogTitle>{title}</DialogTitle>}
        </DialogHeader>

        <DialogDescription>
          {!!description && description}
        </DialogDescription>

        {currentCause?.cause && (
          <div className='flex flex-col gap-2'>

            <div className='flex gap-2 items-center'>
              <div className='text-sm'>{`Uppdaterad pga: ${currentCause.cause}`}</div>
            </div>
            <div className='flex flex-col gap-2'>
              <PromptCauseField onValueChange={currentCause.setCause} cause={currentCause.cause} />
            </div>
          </div>
        )}

        {!!children && <>{children}</>}

        <DialogFooter className='flex flex-col gap-2 pt-4'>
          {!!onSecondary && !!secondaryLabel && (
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
