import { useLink } from '@/hooks/useLink'
import type { Block } from '@ttab/elephant-api/newsdoc'
import { Button, Label, Input } from '@ttab/elephant-ui'
import { X, Eye } from '@ttab/elephant-ui/icons'
import { toast } from 'sonner'
import { useRegistry } from '@/hooks/useRegistry'
import { useSession } from 'next-auth/react'
import { useYValue } from '@/hooks/useYValue'
import { Layouts } from './components/Layouts'
import { LoadingText } from '@/components/LoadingText'
import { Additionals } from './components/Additionals'
import { Position } from './components/Position'
import { Prompt } from '@/components/Prompt'
import { snapshot } from '@/lib/snapshot'
import { useState } from 'react'

export function LayoutBox({
  documentId,
  layoutIdForRender,
  layoutId,
  index,
  deleteLayout
}: {
  documentId: string
  layoutIdForRender: string
  layoutId: string
  index: number
  deleteLayout: (layoutId: string) => void
}) {
  const { baboon } = useRegistry()
  const { data: session } = useSession()
  const openPreview = useLink('PrintPreview')
  const [promptIsOpen, setPromptIsOpen] = useState(false)
  const base = `meta.tt/print-article[0].meta.tt/article-layout[${index}]`
  const [linkTitle] = useYValue<string>(`${base}.links.[_][0].title`)
  const [articleLayout] = useYValue<Block | undefined>(base)
  const [status, setStatus] = useYValue<string>(`${base}.data.status`)

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
      await snapshot(documentId)
      const response = await baboon.renderArticle({
        articleUuid: documentId,
        layoutId: layoutIdForRender,
        renderPdf: true,
        renderPng: false,
        pngScale: 300n
      }, session.accessToken)
      console.log('render response', response?.response)
      if (response?.status.code === 'OK') {
        openPreview(undefined, { source: response?.response?.pdfUrl })
        if (response?.response?.overflows?.length) {
          const _toastText = response?.response?.overflows?.map((overflow) => overflow.frame).join('\n')
          toast.error(`${response?.response?.overflows?.length} fel uppstod när printartikel skulle renderas: ${_toastText}`)
          setStatus('false')
        } else {
          setStatus('true')
        }
      }
    } catch (ex: unknown) {
      openPreview(undefined, { id: 'error' })
      toast.error(`Något gick fel när printartikel skulle renderas: ${ex instanceof Error ? ex.message : 'Okänt fel'}`)
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
              deleteLayout(layoutId)
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
              openPreview(undefined, { })
              void handleRenderArticle()
            }}
          >
            <Eye strokeWidth={1.75} size={16} />
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
            <X strokeWidth={1.75} size={18} />
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
          articleLayoutId={layoutId}
          basePath={base}
          className='w-full'
        />
      </div>
      <Position basePath={base} />
      <Additionals basePath={base} />
    </div>
  )
}
