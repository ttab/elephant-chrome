import { useEffect, useState, type PropsWithChildren, type JSX, useMemo, useLayoutEffect } from 'react'
import { useKeydownGlobal } from '@/hooks/useKeydownGlobal'
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@ttab/elephant-ui'
import type { MouseEvent } from 'react'
import { createPortal } from 'react-dom'


interface PromptProps extends PropsWithChildren {
  title?: string
  description?: string
  primaryLabel: string
  secondaryLabel?: string
  cancelLabel?: string
  onPrimary: (event: MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement> | KeyboardEvent) => void
  onSecondary?: () => void
  onCancel?: () => void
  disablePrimary?: boolean
  primaryVariant?: 'link' | 'secondary' | 'default' | 'destructive' | 'outline' | 'ghost' | 'icon' | null
  currentCause?: { cause: string | undefined, setCause: (value: string) => void }
  anchor?: HTMLElement | null
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
  primaryVariant,
  anchor
}: PromptProps): JSX.Element => {
  useKeydownGlobal((event) => {
    if (event.key === 'Escape' && secondaryLabel && onSecondary) {
      onSecondary()
    }
  })

  const [open, setOpen] = useState<boolean>(true)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)

  useLayoutEffect(() => {
    if (anchor) {
      setAnchorRect(anchor.getBoundingClientRect())
    }
  }, [anchor])


  const dialogStyle = anchorRect
    ? { left: anchorRect.left + anchorRect.width / 2, top: anchorRect.top + anchorRect.height / 2 }
    : undefined

  useEffect(() => {
    return () => {
      document.body.style.pointerEvents = 'auto'
    }
  }, [])

  return (
    <>
      {anchorRect && createPortal(
        <div
          style={{
            position: 'fixed',
            left: anchorRect.left,
            top: anchorRect.top,
            width: anchorRect.width,
            height: anchorRect.height,
            zIndex: 49, // behind built-in overlay (z-50)
            boxShadow: '0 0 0 100vmax rgba(0,0,0,0.6)', // darkens everything outside
            pointerEvents: 'none'
          }}
        />,
        document.body
      )}
      <Dialog open={open} onOpenChange={setOpen} modal={true}>
        <DialogContent
          className='z-50'
          style={dialogStyle}
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
    </>
  )
}
