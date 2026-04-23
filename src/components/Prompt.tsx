import { useEffect, useState, type PropsWithChildren, type JSX, type ReactNode } from 'react'
import { useKeydownGlobal } from '@/hooks/useKeydownGlobal'
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@ttab/elephant-ui'
import type { MouseEvent } from 'react'


interface PromptProps extends PropsWithChildren {
  title?: string
  description?: string
  primaryLabel: ReactNode
  secondaryLabel?: string
  cancelLabel?: string
  onPrimary: (event: MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement> | KeyboardEvent) => void
  onSecondary?: () => void
  onCancel?: () => void
  disablePrimary?: boolean
  primaryVariant?: 'link' | 'secondary' | 'default' | 'destructive' | 'outline' | 'ghost' | 'icon' | null
  currentCause?: { cause: string | undefined, setCause: (value: string) => void }
}

export const Prompt = ({
  title,
  description,
  children,
  primaryLabel,
  secondaryLabel,
  cancelLabel,
  onPrimary,
  onSecondary,
  onCancel,
  disablePrimary = false,
  primaryVariant
}: PromptProps): JSX.Element => {
  const dismiss = onCancel ?? onSecondary

  const [open, setOpen] = useState<boolean>(true)

  useKeydownGlobal((event) => {
    if (event.key === 'Escape' && dismiss) {
      setOpen(false)
      dismiss()
    }
  })

  useEffect(() => {
    return () => {
      document.body.style.pointerEvents = 'auto'
    }
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={true}>
      <DialogContent
        className='z-50'
        onPointerDownOutside={() => {
          dismiss?.()
        }}
      >
        <DialogHeader>
          {!!title && <DialogTitle>{title}</DialogTitle>}
        </DialogHeader>

        <DialogDescription>
          {!!description && description}
        </DialogDescription>

        {!!children && <>{children}</>}

        <DialogFooter className='flex flex-row sm:justify-between justify-between gap-2 pt-4'>
          <div className='flex items-center'>
            {!!onCancel && !!cancelLabel && (
              <Button
                variant='outline'
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  onCancel()
                }}
              >
                {cancelLabel}
              </Button>
            )}
          </div>

          <div className='flex items-center gap-2'>
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
              variant={primaryVariant}
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
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
