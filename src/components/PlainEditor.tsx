import type { EleDocument, EleDocumentResponse } from '@/shared/types'
import { Textbit, type Element } from '@ttab/textbit'
import useSWR from 'swr'
import { LoadingText } from './LoadingText'
import { Bold, Italic, Link, Text, OrderedList, UnorderedList, TTVisual, Factbox, Table } from '@ttab/textbit-plugins'
import { PreVersion } from './Version/PreVersion'
import type { Status as DocumentStatuses } from '@ttab/elephant-api/repository'
import { PreVersionInfo } from './Version/PreVersionInfo'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

const BASE_URL = import.meta.env.BASE_URL || ''

const fetcher = async (url: string): Promise<Element[] | EleDocument | undefined> => {
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

export const Editor = ({ id, version, textOnly = false, direct, versionStatusHistory }: {
  id: string
  textOnly?: boolean
  version?: bigint | undefined
  versionStatusHistory?: DocumentStatuses[]
  direct?: boolean
}): JSX.Element => {
  const { t } = useTranslation('editor')
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
        captionLabel: t('image.captionLabel'),
        bylineLabel: t('image.bylineLabel'),
        removable: false
      }),
      Factbox({
        headerTitle: t('factbox.headerTitle'),
        modifiedLabel: t('factbox.modifiedLabel'),
        footerTitle: t('factbox.footerTitle'),
        removable: false
      })
    ]
  }

  const { data: content, error } = useSWR<Element[] | EleDocument | undefined, Error>(
    documentUrl,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  )

  if (error) {
    return <div>{t('errors:messages.loadFailed')}</div>
  }

  if (!content) {
    return (
      <LoadingText>
        {t('common:misc.loading')}
      </LoadingText>
    )
  }

  if ('title' in content) {
    // Preversion-preview: render non-article types of documents, such as Planning or Event
    return (
      <PreVersion
        content={content}
        version={version}
        versionStatusHistory={versionStatusHistory}
      />
    )
  }

  return (
    <div className='flex flex-col w-full pb-6 overflow-y-auto overflow-x-hidden max-w-(--breakpoint-lg) mx-auto'>
      {versionStatusHistory && version && (
        <PreVersionInfo version={version} versionStatusHistory={versionStatusHistory} />
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
