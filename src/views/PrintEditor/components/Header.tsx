import type { EleBlock } from '@/shared/types'
import { Button } from '@ttab/elephant-ui'
import { CheckCheckIcon, CircleCheckIcon, CopyPlusIcon, ScanEyeIcon, Trash2Icon, TriangleAlertIcon } from '@ttab/elephant-ui/icons'
import { cva } from 'class-variance-authority'
import { Prompt } from '@/components/Prompt'
import { ToastAction } from '@/components/ToastAction'
import { FileIcon } from '@ttab/elephant-ui/icons'
import { useLink } from '@/hooks/useLink'
import { useQuery } from '@/hooks/useQuery'
import { snapshotDocument } from '@/lib/snapshotDocument'
import type { YDocument } from '@/modules/yjs/hooks'
import { useYValue } from '@/modules/yjs/hooks'
import { useState } from 'react'
import { toast } from 'sonner'
import type * as Y from 'yjs'

import { useSession } from 'next-auth/react'
import { useRegistry } from '@/hooks/useRegistry'
import { Checking } from './Checking'

const controlsWrapper = cva(
  'flex flex-col w-full max-w-full items-center justify-end gap-2 rounded border px-2 py-1 shadow-sm items-center gap-1.5 @4xl/view:w-auto @4xl/view:flex-row @4xl/view:justify-start @4xl/view:border-0 @4xl/view:p-0 @4xl/view:shadow-none @4xl/view:bg-transparent',
  {
    variants: {
      tone: {
        warning: 'border-red-200 bg-red-50/80',
        default: 'border-gray-200 bg-white/90 dark:bg-slate-900/40'
      }
    },
    defaultVariants: {
      tone: 'default'
    }
  }
)

const statusBadge = cva(
  'h-9 w-9 rounded-md border flex items-center justify-center @4xl/view:hidden',
  {
    variants: {
      tone: {
        warning: 'text-red-600 border-red-300 bg-red-100',
        default: 'text-emerald-600 border-emerald-200 bg-emerald-50'
      }
    },
    defaultVariants: {
      tone: 'default'
    }
  }
)

const headingClasses = cva(
  'hidden text-base font-bold @4xl/view:flex items-center gap-2 pr-4',
  {
    variants: {
      tone: {
        warning: 'text-red-500',
        default: ''
      }
    },
    defaultVariants: {
      tone: 'default'
    }
  }
)

export const LayoutBoxHeader = ({ ydoc, selected, onSelectAll, onSelectedDelete }: {
  ydoc: YDocument<Y.Map<unknown>>
  selected: Array<string>
  onSelectAll: () => void
  onSelectedDelete: () => void
}) => {
  const [layouts, setLayouts] = useYValue<EleBlock[]>(ydoc.ele, 'meta.tt/print-article[0].meta.tt/article-layout')
  const { data: session } = useSession()
  const { baboon } = useRegistry()
  const [, , allParams] = useQuery(['from'], true)
  const openPrintArticle = useLink('PrintEditor')
  const [promptIsOpen, setPromptIsOpen] = useState(false)
  const [promptDeleteSelectedIsOpen, setPromptDeleteSelectedIsOpen] = useState(false)
  const [name] = useYValue<string>(ydoc.ele, 'meta.tt/print-article[0].name')
  const [flowUuid] = useYValue<string>(ydoc.ele, 'links.tt/print-flow[0].uuid')
  const fromDate = allParams?.filter((item) => item.name === 'Print')?.[0]?.params?.from
  const [date] = useYValue<string>(ydoc.ele, 'meta.tt/print-article[0].data.date')
  const hasFailingLayout = layouts?.some((layout) => layout.data?.status === 'false')
  const tone = hasFailingLayout ? 'warning' : 'default'

  const [isChecking, setIsChecking] = useState(false)

  const handleConfirmDeleteSelected = () => {
    setPromptDeleteSelectedIsOpen(false)
    onSelectedDelete()
  }

  const onDuplicateArticle = () => {
    setPromptIsOpen(false)

    snapshotDocument(ydoc.id, undefined, ydoc.provider?.document)
      .then(() => {
        void handleCopyArticle()
      })
      .catch((ex: Error) => {
        toast.error(ex instanceof Error ? ex.message : 'Något gick fel när printartikel skulle dupliceras')
      })
  }

  const handleCopyArticle = async () => {
    if (!baboon || !session?.accessToken) {
      console.error(`Missing prerequisites: ${!baboon ? 'baboon-client' : 'accessToken'} is missing`)
      toast.error('Något gick fel när printartikel skulle dupliceras')
      return
    }

    try {
      const _date = (fromDate || date) as string
      const response = await baboon.createPrintArticle({
        sourceUuid: ydoc.id,
        flowUuid: flowUuid || '',
        date: _date,
        article: name || ''
      }, session.accessToken)

      if (response?.status.code === 'OK') {
        openPrintArticle(undefined, { id: response?.response?.uuid }, 'self')
        setPromptIsOpen(false)
        toast.success(`Printartikel har duplicerats till: ${_date}`, {
          action: (
            <ToastAction
              documentId={response?.response?.uuid}
              withView='PrintEditor'
              label='Öppna artikeln'
              Icon={FileIcon}
              target='self'
            />
          )
        })
      }
    } catch (ex: unknown) {
      console.error('Error creating print article:', ex)
      toast.error('Något gick fel när printartikel skulle dupliceras')
      setPromptIsOpen(false)
    }
  }


  async function checkAllLayouts(arr: EleBlock[]) {
    if (!baboon || !session?.accessToken) {
      throw new Error(`Missing prerequisites: ${!baboon ? 'baboon-client' : 'accessToken'} is missing`)
    }

    const renderAndEvaluateLayout = async (_layout: EleBlock) => {
      const response = await baboon.renderArticle({
        articleUuid: ydoc.id,
        layoutId: _layout.id,
        renderPdf: true,
        renderPng: false,
        pngScale: 300n
      }, session.accessToken)

      if (response?.status.code !== 'OK') {
        return null
      }

      const overflowsStatus = response.response?.overflows?.length > 0
      const underflowsStatus = response.response?.underflows?.length > 0
      const lowresPicsStatus = response.response?.images?.filter((image) => image.ppi <= 130).length > 0

      return {
        ..._layout,
        data: {
          ..._layout?.data,
          status: overflowsStatus || underflowsStatus || lowresPicsStatus ? 'false' : 'true'
        }
      }
    }

    const results: EleBlock[] = []
    const chunkSize = 3

    for (let index = 0; index < arr.length; index += chunkSize) {
      const chunk = arr.slice(index, index + chunkSize)
      const chunkResults = await Promise.allSettled(chunk.map(renderAndEvaluateLayout))

      chunkResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          results.push(result.value)
        }
      })
    }

    return results
  }

  const statusChecker = async () => {
    if (!layouts?.length) {
      return
    }

    try {
      await snapshotDocument(ydoc.id, undefined, ydoc.provider?.document)

      setIsChecking(true)
      const updatedLayouts = await checkAllLayouts(layouts)
      const updateMap = new Map(updatedLayouts.map((layout) => [layout.id, layout]))

      setLayouts(layouts.map((layout) => updateMap.get(layout.id) ?? layout))
      setIsChecking(false)
    } catch (ex) {
      setIsChecking(false)
      toast.error(ex instanceof Error ? ex.message : 'Något gick fel när layouterna skulle kontrolleras')
    }
  }

  if (isChecking) {
    return <Checking />
  }


  return (
    <header className='w-full flex flex-col gap-2 @4xl/view:flex-row @4xl/view:items-center @4xl/view:justify-between @4xl/view:mb-2'>
      <div className={controlsWrapper({ tone })}>
        <Button
          variant='ghost'
          size='sm'
          className='h-9 w-9 p-0'
          aria-label='Kontrollera layouter'
          title='Kontrollera layouter'
          onClick={() => { void statusChecker() }}
        >
          <ScanEyeIcon strokeWidth={1.75} size={18} />
        </Button>
        <Button
          variant='ghost'
          size='sm'
          className='h-9 w-9 p-0'
          aria-label='Duplicera artikel'
          title='Duplicera artikel'
          onClick={() => setPromptIsOpen(true)}
        >
          <CopyPlusIcon strokeWidth={1.75} size={18} />
        </Button>
        {!selected.length
          ? (
              <Button
                variant='ghost'
                size='sm'
                className='h-9 w-9 p-0'
                aria-label='Välj alla layouter'
                title='Välj alla layouter'
                onClick={onSelectAll}
              >
                <CheckCheckIcon strokeWidth={1.75} size={18} />
              </Button>
            )
          : (
              <Button
                variant='ghost'
                size='sm'
                className='h-9 w-9 p-0'
                aria-label='Radera valda layouter'
                title='Radera valda layouter'
                disabled={layouts?.length === selected.length}
                onClick={() => setPromptDeleteSelectedIsOpen(true)}
              >
                <Trash2Icon strokeWidth={1.75} size={18} />
              </Button>
            )}
        <span
          className={statusBadge({ tone })}
          aria-label={hasFailingLayout ? 'Layoutfel upptäckta' : 'Alla layouter godkända'}
        >
          {hasFailingLayout
            ? <TriangleAlertIcon strokeWidth={1.75} size={18} />
            : <CircleCheckIcon strokeWidth={1.75} size={18} />}
        </span>
      </div>

      <h2 className={headingClasses({ tone })}>
        {hasFailingLayout
          ? <TriangleAlertIcon size={18} strokeWidth={1.75} className='text-red-500' />
          : <CircleCheckIcon size={18} strokeWidth={1.75} className='text-emerald-600' />}
        Layouter
        <span className='text-sm text-muted-foreground'>
          (
          {layouts?.length}
          )
        </span>
      </h2>

      {promptIsOpen && (
        <Prompt
          title='Duplicera artikel'
          description='Är du säker på att du vill duplicera denna artikel?'
          primaryLabel='Duplicera'
          secondaryLabel='Avbryt'
          onPrimary={onDuplicateArticle}
          onSecondary={() => {
            setPromptIsOpen(false)
          }}
        />
      )}

      {promptDeleteSelectedIsOpen && (
        <Prompt
          title='Radera layouterna'
          description='Är du säker på att du vill radera valda layouter?'
          primaryLabel='Radera valda'
          secondaryLabel='Avbryt'
          onPrimary={handleConfirmDeleteSelected}
          onSecondary={() => {
            setPromptDeleteSelectedIsOpen(false)
          }}
        />
      )}
    </header>
  )
}
