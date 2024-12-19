import type { EleDocumentResponse } from '@/shared/types'
import type { TBElement } from '@ttab/textbit'
import Textbit from '@ttab/textbit'
import useSWR from 'swr'
import { LoadingText } from './LoadingText'
import { Bold, Italic, Link, Text, OrderedList, UnorderedList, TTVisual, Factbox, Table } from '@ttab/textbit-plugins'

const BASE_URL = import.meta.env.BASE_URL || ''


const plugins = [Text, UnorderedList, OrderedList, Bold, Italic, Link, TTVisual, Factbox, Table]

export const Editor = ({ id }: { id: string }): JSX.Element => {
  const fetcher = async (): Promise<EleDocumentResponse> => {
    const response = await fetch(`${BASE_URL}/api/documents/${id}`)
    if (!response.ok) {
      throw new Error('Network response was not ok')
    }
    const result = await response.json() as EleDocumentResponse
    return result
  }

  const { data: document, error } = useSWR<EleDocumentResponse, Error>(id, fetcher)

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
          readOnly
          value={document.document?.content as TBElement[]}
          className='outline-none pb-6 max-h-[30vh] overflow-y-scroll dark:text-slate-100 px-2'
        />
      </Textbit.Root>
    </div>
  )
}
