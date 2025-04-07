import type { EleDocument, EleDocumentResponse } from '@/shared/types'
import Textbit, { type TBElement } from '@ttab/textbit'
import useSWR from 'swr'
import { LoadingText } from './LoadingText'
import { Bold, Italic, Link, Text, OrderedList, UnorderedList, TTVisual, Factbox, Table } from '@ttab/textbit-plugins'
import { PreVersion } from './Version/PreVersion'
import type { DocumentVersion } from '@ttab/elephant-api/repository'
import { PreVersionInfo } from './Version/PreVersionInfo'
const BASE_URL = import.meta.env.BASE_URL || ''

const plugins = [Text, UnorderedList, OrderedList, Bold, Italic, Link, TTVisual, Factbox, Table]

const fetcher = async (url: string): Promise<TBElement[] | EleDocument | undefined> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Network response was not ok')
  }
  const result = await response.json() as EleDocumentResponse

  if (result.document?.content.length === 0 && result?.document?.meta && result?.document?.links) {
    return result?.document
  }
  return result.document?.content
}

export const Editor = ({ id, version, textOnly = false, versionHistory }: {
  id: string
  textOnly?: boolean
  version?: bigint | undefined
  versionHistory?: DocumentVersion[]
}): JSX.Element => {
  const { data: content, error } = useSWR<TBElement[] | EleDocument | undefined, Error>(
    `${BASE_URL}/api/documents/${id}${version ? `?version=${version}` : ''}`,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  )

  if (error) return <div>Failed to load</div>

  if (!content) return (
    <LoadingText>
      Laddar...
    </LoadingText>
  )

  if ('title' in content) {
    // Preversion-preview: render non-article types of documents, such as Planning or Event
    return (
      <PreVersion
        content={content}
        version={version}
        versionHistory={versionHistory}
      />
    )
  }

  return (
    <div className='flex flex-col w-full pb-6 overflow-y-auto overflow-x-hidden max-w-screen-lg mx-auto'>
      {versionHistory && version && (
        <PreVersionInfo version={version} versionHistory={versionHistory} />
      )}
      <Textbit.Root plugins={[...plugins.map((initPlugin) => initPlugin()), Text({
        classNames: {
          'heading-1': 'text-lg font-bold py-2',
          'heading-2': 'text-md font-bold py-1'
        }
      })]}
      >
        <Textbit.Editable
          key={id}
          readOnly
          value={filterText(content, textOnly)}
        />
      </Textbit.Root>
    </div>

  )
}

function filterText(content: TBElement[], textOnly: boolean): TBElement[] {
  if (!textOnly) {
    return content
  }

  return content.filter((c) => c.type !== 'tt/visual')
}
