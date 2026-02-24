import type { EleDocument, EleDocumentResponse } from '@/shared/types'
import { Textbit, type Element } from '@ttab/textbit'
import useSWR from 'swr'
import { LoadingText } from './LoadingText'
import { Bold, Italic, Link, Text, OrderedList, UnorderedList, TTVisual, Factbox, Table } from '@ttab/textbit-plugins'
import { PreVersion } from './Version/PreVersion'
import type { Status as DocumentStatuses } from '@ttab/elephant-api/repository'
import { PreVersionInfo } from './Version/PreVersionInfo'
import type { JSX } from 'react'
import { cn } from '@ttab/elephant-ui/utils'
import { Alert, AlertDescription } from '@ttab/elephant-ui'
import { MessageCircleMoreIcon } from '@ttab/elephant-ui/icons'

const BASE_URL = import.meta.env.BASE_URL || ''

const fetcher = async (url: string): Promise<EleDocument | undefined> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Network response was not ok')
  }
  const result = await response.json() as EleDocumentResponse
  return result.document
}

export const Editor = ({ id, version, textOnly = false, direct, versionStatusHistory, disableScroll = false, showNotes = false }: {
  id: string
  textOnly?: boolean
  version?: bigint | undefined
  versionStatusHistory?: DocumentStatuses[]
  direct?: boolean
  disableScroll?: boolean
  showNotes?: boolean
}): JSX.Element => {
  const searchParams = new URLSearchParams()
  if (typeof version !== 'undefined') {
    searchParams.set('version', version.toString())
  }

  if (direct) {
    searchParams.set('direct', 'true')
  }

  const documentUrl = `${BASE_URL}/api/documents/${id}${searchParams.size ? `?${searchParams.toString()}` : ''}`

  const getPlugins = () => {
    const basePlugins = [Text, UnorderedList, OrderedList, Bold, Italic, Link, Table]
    return [
      ...basePlugins.map((initPlugin) => initPlugin()),
      Text(),
      TTVisual({
        removable: false
      }),
      Factbox({
        removable: false
      })
    ]
  }

  const { data: document, error } = useSWR<EleDocument | undefined, Error>(
    documentUrl,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  )

  if (error) {
    return <div>Failed to load</div>
  }

  if (!document) {
    return (
      <LoadingText>
        Laddar...
      </LoadingText>
    )
  }

  const content = document.content

  if (!content.length && document.meta && document.links) {
    // Preversion-preview: render non-article types of documents, such as Planning or Event
    return (
      <PreVersion
        content={document}
        version={version}
        versionStatusHistory={versionStatusHistory}
      />
    )
  }

  const notes = showNotes ? (document.meta['core/note'] ?? []) : []

  return (
    <div className={cn(
      'flex flex-col w-full pb-6 overflow-x-hidden max-w-(--breakpoint-lg) mx-auto',
      !disableScroll && 'overflow-y-auto'
    )}
    >
      {versionStatusHistory && version && (
        <PreVersionInfo version={version} versionStatusHistory={versionStatusHistory} />
      )}

      {!!notes.length && (
        <div className='pe-12 ps-12 mt-6'>
          {notes.map((note, index) => (
            <div key={index} className='flex flex-row gap-2 w-full justify-between items-center'>
              <Alert className='flex py-3 px-4  bg-blue-50 dark:bg-blue-800 items-center'>
                <MessageCircleMoreIcon size={18} strokeWidth={1.75} className='shrink-0 -mt-1.5' />
                <AlertDescription>{note.data?.text}</AlertDescription>
              </Alert>
            </div>
          ))}
        </div>
      )}

      <Textbit.Root
        key={id}
        value={filterText(content, textOnly)}
        plugins={getPlugins()}
        readOnly
      >
        <Textbit.Editable
          className={`outline-none
            pt-4
            pb-4
            ps-12
            pe-12
            dark:text-slate-100
            **:data-spelling-error:border-b-2
            **:data-spelling-error:border-dotted
            **:data-spelling-error:border-red-500
            grow
            pr-12
            max-w-(--breakpoint-xl)`}
        />
      </Textbit.Root>
    </div>

  )
}

function filterText(content: Element[], textOnly: boolean): Element[] {
  if (!textOnly) {
    return content
  }

  return content.filter((c) => c.type !== 'tt/visual')
}
