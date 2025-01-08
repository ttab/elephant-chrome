import type { EleDocumentResponse } from '@/shared/types'
import type { TBElement } from '@ttab/textbit'
import Textbit from '@ttab/textbit'
import useSWR from 'swr'
import { LoadingText } from './LoadingText'
import { Bold, Italic, Link, Text, OrderedList, UnorderedList, TTVisual, Factbox, Table } from '@ttab/textbit-plugins'

const BASE_URL = import.meta.env.BASE_URL || ''


const plugins = [Text, UnorderedList, OrderedList, Bold, Italic, Link, TTVisual, Factbox, Table]

const fetcher = async (url: string): Promise<TBElement[] | undefined> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Network response was not ok')
  }
  const result = await response.json() as EleDocumentResponse
  return result.document?.content
}

export const Editor = ({ id, textOnly = false }: {
  id: string
  textOnly?: boolean
}): JSX.Element => {
  const { data: content, error } = useSWR<TBElement[] | undefined, Error>(
    `${BASE_URL}/api/documents/${id}`,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  )

  if (error) return <div>Failed to load</div>
  if (!document) return (
    <LoadingText>
      Laddar...
    </LoadingText>
  )

  return (
    <div className='flex-grow overflow-auto max-w-screen-lg mx-auto'>
      <Textbit.Root plugins={plugins.map((initPlugin) => initPlugin())}>
        <Textbit.Editable
          key={id}
          readOnly
          value={filterText(content, textOnly)}
          className='outline-none pb-6 max-h-[30vh] overflow-y-scroll dark:text-slate-100 px-2'
        />
      </Textbit.Root>
    </div>
  )
}

function filterText(content: TBElement[] | undefined, textOnly: boolean): TBElement[] | undefined {
  if (!textOnly) {
    return content
  }

  return content?.filter((c) => c.type !== 'tt/visual')
}
