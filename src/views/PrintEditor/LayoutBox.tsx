import { useLink } from '@/hooks/useLink'
import type { Block } from '@ttab/elephant-api/newsdoc'
import { Button, Label, Input } from '@ttab/elephant-ui'
import { XIcon, EyeIcon } from '@ttab/elephant-ui/icons'
import { toast } from 'sonner'
import { useRegistry } from '@/hooks/useRegistry'
import { useSession } from 'next-auth/react'
import { Layouts } from './components/Layouts'
import { LoadingText } from '@/components/LoadingText'
import { Additionals } from './components/Additionals'
import { Position } from './components/Position'
import { Prompt } from '@/components/Prompt'
import { snapshotDocument } from '@/lib/snapshotDocument'
import { type ReactNode, useState } from 'react'
import type { YDocument } from '@/modules/yjs/hooks'
import { useYValue } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'

export function LayoutBox({
  ydoc,
  layoutIdForRender,
  layoutId,
  index,
  deleteLayout,
  onChange
}: {
  ydoc: YDocument<Y.Map<unknown>>
  layoutIdForRender: string
  layoutId: string
  index: number
  deleteLayout: (layoutId: string) => void
  onChange?: (value: boolean) => void
}) {
  const { baboon } = useRegistry()
  const { data: session } = useSession()
  const openPreview = useLink('PrintPreview')
  const [promptIsOpen, setPromptIsOpen] = useState(false)
  const base = `meta.tt/print-article[0].meta.tt/article-layout[${index}]`
  const [linkTitle] = useYValue<string>(ydoc.ele, `${base}.links.[_][0].title`)
  const [articleLayout] = useYValue<Block | undefined>(ydoc.ele, base)
  const [status, setStatus] = useYValue<string>(ydoc.ele, `${base}.data.status`)

  if (!articleLayout) {
    return (
      <LoadingText>
        Laddar layout
      </LoadingText>
    )
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
        let _lowresToastText: ReactNode | undefined = undefined
        if (lowresPics.length > 0) {
          _lowresToastText = (
            <div>
              <h3 className='font-bold text-gray-500 mt-2'>Bilder (under 130 ppi)</h3>
              {lowresPics.map((image, index) => {
                return (
                  <div key={index}>
                    {index + 1}
                    .&nbsp;
                    {image.frame}
                    &nbsp;
                    (
                    {Math.round(image.ppi)}
                    &nbsp;
                    ppi)
                  </div>
                )
              })}
            </div>
          )
        }
        let _overflowToastText: ReactNode | undefined = undefined
        if (response?.response?.overflows?.length) {
          _overflowToastText = (
            <div>
              <h3 className='font-bold text-gray-500 mt-2'>Overflows</h3>
              {response?.response?.overflows?.map((overflow, index) => {
                return (
                  <div key={index}>
                    {index + 1}
                    .&nbsp;
                    {overflow.frame}
                  </div>
                )
              })}
            </div>
          )
        }
        let _underflowToastText: ReactNode | undefined = undefined
        if (response?.response?.underflows?.length) {
          _underflowToastText = (
            <div>
              <h3 className='font-bold text-gray-500 mt-2'>Underflows</h3>
              {response?.response?.underflows?.map((underflow, index) => {
                return (
                  <div key={index}>
                    {index + 1}
                    .&nbsp;
                    {underflow.frame}
                  </div>
                )
              })}
            </div>
          )
        }
        if (_overflowToastText || _lowresToastText || _underflowToastText) {
          toast.error('', {
            description: (
              <div>
                {_lowresToastText}
                {_overflowToastText}
                {_underflowToastText}
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

  const getBgColor = () => {
    if (status === 'true') {
      return 'bg-approved-background border-approved-border border-s-approved border-s-[6px]'
    } else if (status === 'false') {
      return 'bg-red-100 border-red-200 border-s-red-500 border-s-[6px]'
    } else {
      return 'border-gray-100 border-s-gray-200 border-s-[6px]'
    }
  }

  return (
    <div id={layoutId} className={`border min-h-32 p-2 pt-0 grid grid-cols-12 rounded ${getBgColor()}`}>
      <header className='col-span-12 row-span-1 gap-2 flex items-center justify-between'>
        {promptIsOpen && (
          <Prompt
            title='Radera layouten'
            description='Är du säker på att du vill radera denna layout?'
            primaryLabel='Radera'
            secondaryLabel='Avbryt'
            onPrimary={() => {
              deleteLayout(layoutIdForRender)
              setPromptIsOpen(false)
            }}
            onSecondary={() => {
              setPromptIsOpen(false)
            }}
          />
        )}
        <div className='flex items-center gap-2'>
          <Button
            variant='ghost'
            className='group/render px-2 py-0 flex gap-2 justify-start hover:bg-approved-background/50'
            size='sm'
            onClick={() => {
              snapshotDocument(ydoc.id, undefined, ydoc.provider?.document)
                .then(() => {
                  openPreview(undefined, {})
                  void handleRenderArticle()
                })
                .catch((ex) => {
                  toast.error(ex instanceof Error ? ex.message : 'Kunde inte spara artikel innan förhandsgranskning')
                })
            }}
          >
            <EyeIcon strokeWidth={1.75} size={16} />
            <Label className='cursor-pointer transition-opacity ease-in-out delay-500 opacity-0 group-hover/render:opacity-100'>
              Förhandsgranska
            </Label>
          </Button>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='ghost'
            className='p-2'
            onClick={() => {
              setPromptIsOpen(true)
            }}
          >
            <XIcon strokeWidth={1.75} size={18} />
          </Button>
        </div>
      </header>
      <div className='col-span-12 row-span-1 mb-1'>
        <Input
          type='text'
          readOnly
          placeholder='Namn'
          value={linkTitle}
        />
      </div>
      <div className='col-span-10 row-span-1 mr-1'>
        <Layouts
          ydoc={ydoc}
          articleLayoutId={layoutId}
          basePath={base}
          className='w-full'
          onChange={onChange}
        />
      </div>
      <Position ydoc={ydoc} basePath={base} />
      <Additionals ydoc={ydoc} basePath={base} />
    </div>
  )
}
