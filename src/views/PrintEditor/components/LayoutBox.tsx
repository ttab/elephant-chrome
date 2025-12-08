import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cva } from 'class-variance-authority'
import { useRegistry } from '@/hooks/useRegistry'
import { useSession } from 'next-auth/react'
import { useLink } from '@/hooks/useLink'
import type * as Y from 'yjs'
import type { YDocument } from '@/modules/yjs/hooks'
import { useYValue } from '@/modules/yjs/hooks'
import type { Block } from '@ttab/elephant-api/newsdoc'
import { Checkbox, Button } from '@ttab/elephant-ui'
import { EyeIcon } from '@ttab/elephant-ui/icons'
import { cn } from '@ttab/elephant-ui/utils'
import { Prompt } from '@/components/Prompt'
import { LoadingText } from '@/components/LoadingText'
import { toast } from 'sonner'
import { snapshotDocument } from '@/lib/snapshotDocument'
import { LayoutPanelContent } from './LayoutPanelContent'

type LayoutBoxProps = {
  ydoc: YDocument<Y.Map<unknown>>
  index: number
  layoutIdForRender: string
  layoutUuid: string
  openedLayoutId: string | null
  setOpenedLayoutId: (layoutId: string | null) => void
  onDeleteLayout: () => void
  selected: Array<string>
  setSelected: (selected: Array<string>) => void
}

type LayoutStatusTone = 'approved' | 'rejected' | 'pending'

const layoutStatusStyles = cva('', {
  variants: {
    intent: {
      panel: 'border-s-[6px]',
      rail: 'border border-l-[4px]'
    },
    tone: {
      approved: '',
      rejected: '',
      pending: ''
    }
  },
  defaultVariants: {
    tone: 'pending'
  },
  compoundVariants: [
    {
      intent: 'panel',
      tone: 'approved',
      className: 'bg-approved-background border-approved-border border-s-approved'
    },
    {
      intent: 'panel',
      tone: 'rejected',
      className: 'bg-red-100 border-red-200 border-s-red-500'
    },
    {
      intent: 'panel',
      tone: 'pending',
      className: 'border-gray-100 border-s-gray-200'
    },
    {
      intent: 'rail',
      tone: 'approved',
      className: 'bg-approved-background border-approved-border border-l-approved opacity-50'
    },
    {
      intent: 'rail',
      tone: 'rejected',
      className: 'bg-red-100 border-red-200 border-l-red-500'
    },
    {
      intent: 'rail',
      tone: 'pending',
      className: 'bg-gray-50 border-gray-200 border-l-gray-300'
    }
  ]
})

export const LayoutBox = ({
  ydoc,
  index,
  layoutIdForRender,
  layoutUuid,
  openedLayoutId,
  setOpenedLayoutId,
  onDeleteLayout,
  selected,
  setSelected
}: LayoutBoxProps) => {
  const { baboon } = useRegistry()
  const { data: session } = useSession()
  const openPreview = useLink('PrintPreview')
  const [promptIsOpen, setPromptIsOpen] = useState(false)
  const basePath = `meta.tt/print-article[0].meta.tt/article-layout[${index}]`
  const [linkTitle] = useYValue<string>(ydoc.ele, `${basePath}.links.[_][0].title`)
  const [articleLayout] = useYValue<Block | undefined>(ydoc.ele, basePath)
  const [status, setStatus] = useYValue<string>(ydoc.ele, `${basePath}.data.status`)
  const floatingPanelRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLDivElement | null>(null)


  const isPinnedOpen = openedLayoutId === layoutIdForRender
  useEffect(() => {
    if (!isPinnedOpen) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      const panel = floatingPanelRef.current
      const trigger = triggerRef.current
      if (!panel || !(target instanceof Node)) {
        return
      }

      if (panel.contains(target) || (trigger && trigger.contains(target))) {
        return
      }

      setOpenedLayoutId(null)
    }

    window.addEventListener('pointerdown', handlePointerDown)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [isPinnedOpen, setOpenedLayoutId])


  if (!articleLayout) {
    return (
      <LoadingText>
        Laddar layout
      </LoadingText>
    )
  }

  const layoutLabel = linkTitle?.trim()?.length ? linkTitle : 'Layout'
  const layoutTone: LayoutStatusTone = status === 'true'
    ? 'approved'
    : status === 'false'
      ? 'rejected'
      : 'pending'

  const isSelected = selected.includes(layoutIdForRender)
  const panelClassName = layoutStatusStyles({ intent: 'panel', tone: layoutTone })

  const floatingPanelOpenClasses = 'lg:pointer-events-auto lg:opacity-100 lg:translate-x-0 lg:scale-100'

  const handleToggleSelection = () => {
    if (isSelected) {
      setSelected(selected.filter((id) => id !== layoutIdForRender))
    } else {
      setSelected([...selected, layoutIdForRender])
    }
  }

  const handleRenderArticle = async () => {
    if (!baboon || !session?.accessToken) {
      console.error(`Missing prerequisites: ${!baboon ? 'baboon-client' : 'accessToken'} is missing`)
      toast.error('Något gick fel när printartikel skulle renderas')
      return
    }

    try {
      const response = await baboon.renderArticle({
        articleUuid: ydoc.id,
        layoutId: layoutIdForRender,
        renderPdf: true,
        renderPng: false,
        pngScale: 300n
      }, session.accessToken)
      if (response?.status.code === 'OK') {
        openPreview(undefined, { source: response?.response?.pdfUrl })
        const lowresPics = response?.response?.images?.filter((image) => image.ppi <= 130)
        let lowresToastText: ReactNode | undefined
        if (lowresPics.length > 0) {
          lowresToastText = (
            <div>
              <h3 className='font-bold text-gray-500 mt-2'>Bilder (under 130 ppi)</h3>
              {lowresPics.map((image, indexLow) => (
                <div key={indexLow}>
                  {indexLow + 1}
                  .
                  &nbsp;
                  {image.frame}
                  &nbsp;(
                  {Math.round(image.ppi)}
                  &nbsp;ppi)
                </div>
              ))}
            </div>
          )
        }
        let overflowToastText: ReactNode | undefined
        if (response?.response?.overflows?.length) {
          overflowToastText = (
            <div>
              <h3 className='font-bold text-gray-500 mt-2'>Overflows</h3>
              {response?.response?.overflows?.map((overflow, indexOverflow) => (
                <div key={indexOverflow}>
                  {indexOverflow + 1}
                  .
                  &nbsp;
                  {overflow.frame}
                </div>
              ))}
            </div>
          )
        }
        let underflowToastText: ReactNode | undefined
        if (response?.response?.underflows?.length) {
          underflowToastText = (
            <div>
              <h3 className='font-bold text-gray-500 mt-2'>Underflows</h3>
              {response?.response?.underflows?.map((underflow, indexUnderflow) => (
                <div key={indexUnderflow}>
                  {indexUnderflow + 1}
                  .
                  &nbsp;
                  {underflow.frame}
                </div>
              ))}
            </div>
          )
        }
        if (overflowToastText || lowresToastText || underflowToastText) {
          toast.error('', {
            description: (
              <div>
                {lowresToastText}
                {overflowToastText}
                {underflowToastText}
              </div>
            ),
            duration: 15000,
            cancel: {
              label: 'Stäng',
              onClick: () => null
            }
          })
          setStatus('false')
        } else {
          setStatus('true')
        }
      }
    } catch (ex: unknown) {
      openPreview(undefined, { id: 'error' })
      toast.error('Något gick fel när printartikel skulle renderas', {
        description: ex instanceof Error ? ex.message : 'Okänt fel'
      })
    }
  }

  const previewLayout = async () => {
    try {
      await snapshotDocument(ydoc.id, undefined, ydoc.provider?.document)
      openPreview(undefined, {})
      await handleRenderArticle()
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : 'Kunde inte spara artikel innan förhandsgranskning')
    }
  }

  const handleConfirmDelete = () => {
    if (isPinnedOpen) {
      setOpenedLayoutId(null)
    }
    onDeleteLayout()
    setPromptIsOpen(false)
  }

  return (
    <>
      <div className='w-full @4xl/view:hidden'>
        <div
          className={cn(
            'flex flex-col relative rounded w-[2.75rem] ml-auto items-end cursor-pointer'
          )}
        >
          <div
            role='group'
            aria-label='Layoutkontroller'
            data-state={isPinnedOpen ? 'selected' : undefined}
            className={cn(
              'flex flex-col items-center justify-center w-[2.75rem] min-w-[2.75rem] rounded border p-2 @4xl/view:hidden font-semibold uppercase transition-all transform',
              'data-[state=selected]:shadow-xl data-[state=selected]:opacity-50 data-[state=selected]:scale-[98%]',
              layoutStatusStyles({ intent: 'rail', tone: layoutTone })
            )}
            ref={triggerRef}
            onClick={(event) => {
              event.stopPropagation()
              setOpenedLayoutId(isPinnedOpen ? null : layoutIdForRender)
            }}
          >
            <Button
              size='xs'
              variant='icon'
              aria-label='Förhandsgranska layout'
              title='Förhandsgranska layout'
              onClick={(event) => {
                event.stopPropagation()
                void previewLayout()
              }}
            >
              <EyeIcon size={16} strokeWidth={1.75} />
            </Button>
            <Checkbox
              className='mb-2'
              checked={selected.includes(layoutIdForRender)}
              onCheckedChange={() => {
                if (selected.includes(layoutIdForRender)) {
                  setSelected(selected.filter((id) => id !== layoutIdForRender))
                } else {
                  setSelected([...selected, layoutIdForRender])
                }
              }}
              onClick={(event) => { event.stopPropagation() }}
            />
            <span
              title={isPinnedOpen ? 'Fäll in layoutpanelen' : 'Visa layoutpanelen'}
              className='inline-flex items-center justify-center text-[0.6rem] tracking-[0.18em] leading-1 [writing-mode:vertical-rl] rotate-180 cursor-pointer'
            >
              {layoutLabel}
            </span>
          </div>

          <div className='hidden lg:block'>
            <LayoutPanelContent
              ref={floatingPanelRef}
              className={cn(
                'transition-all duration-200 ease-out absolute right-full mr-3 top-0 w-96 pointer-events-none opacity-0 shadow-2xl z-50',
                isPinnedOpen ? floatingPanelOpenClasses : undefined
              )}
              panelClassName={panelClassName}
              ydoc={ydoc}
              basePath={basePath}
              layoutUuid={layoutUuid}
              linkTitle={linkTitle}
              isSelected={isSelected}
              onToggleSelection={handleToggleSelection}
              onPreview={() => { void previewLayout() }}
              onRequestDelete={() => {
                setPromptIsOpen(true)
              }}
            />
          </div>
        </div>
      </div>

      <div className='hidden w-full @4xl/view:block mr-2.5'>
        <LayoutPanelContent
          panelClassName={panelClassName}
          ydoc={ydoc}
          basePath={basePath}
          layoutUuid={layoutUuid}
          linkTitle={linkTitle}
          isSelected={isSelected}
          onToggleSelection={handleToggleSelection}
          onPreview={() => { void previewLayout() }}
          onRequestDelete={() => {
            setPromptIsOpen(true)
          }}
        />
      </div>


      {promptIsOpen && (
        <Prompt
          title='Radera layouten'
          description='Är du säker på att du vill radera denna layout?'
          primaryLabel='Radera'
          secondaryLabel='Avbryt'
          onPrimary={handleConfirmDelete}
          onSecondary={() => {
            setPromptIsOpen(false)
          }}
        />
      )}
    </>

  )
}
