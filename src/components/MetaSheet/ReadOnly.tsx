import useSWR from 'swr'
import { Label } from '@ttab/elephant-ui'
import { Version } from '@/components/Version'
import { toast } from 'sonner'
import type { EleBlockGroup, EleDocumentResponse } from '@/shared/types'
import type { ReactNode } from 'react'
import { useEditorialInfoTypes } from '@/hooks/useEditorialInfoType'
import { useTranslation } from 'react-i18next'

const BASE_URL = import.meta.env.BASE_URL || ''
type FetcherResult = {
  meta: EleBlockGroup | undefined
  links: EleBlockGroup | undefined
} | undefined

const ValueBlock = ({ label, value }: { label: string, value: string | number | undefined }) => {
  if (!value) {
    return <></>
  }

  return (
    <div className='text-sm flex flex-col gap-1'>
      <div className='text-muted-foreground'>{label}</div>
      <div className='font-bold'>{`${value}`}</div>
    </div>
  )
}

const InfoBlock = ({ labelId, text, children }: { labelId: string, text: string, children: ReactNode }) => (
  <>
    <Label htmlFor={labelId} className='text-xs text-muted-foreground -mb-3'>{text}</Label>
    <div className='flex flex-col gap-3' id={labelId}>
      {children}
    </div>
  </>
)


export const ReadOnly = ({ documentId, version }: { documentId: string, version: bigint | undefined }) => {
  const editorialInfoTypes = useEditorialInfoTypes()
  const { t } = useTranslation('metaSheet')
  const fetcher = async (params: string[]): Promise<FetcherResult> => {
    const [url] = params
    const response = await fetch(url)

    if (!response.ok) {
      console.error(`Fetch metadata error for ${documentId}:`, error)
      toast.error(t('errors.failedToLoadMetaData'))
      throw new Error('Readonly: Network response was not ok')
    }

    const result = await response.json() as EleDocumentResponse

    if (result?.document?.content.length === 0 && result?.document?.meta && result?.document?.links) {
      return result?.document
    }

    return { meta: result.document?.meta, links: result.document?.links }
  }

  const { data, error } = useSWR<FetcherResult, Error>(
    [`${BASE_URL}/api/documents/${documentId}${version ? `?version=${version}` : ''}`, documentId],
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  )

  if (error) {
    return <div></div>
  }

  const newsvalue = data?.meta?.['core/newsvalue']?.[0]?.value
  const slugline = data?.meta?.['tt/slugline']?.[0]?.value
  const section = data?.links?.['core/section']?.[0]?.title
  const category = data?.links?.['core/category']?.[0]?.title
  const story = data?.links?.['core/story']?.[0]?.title
  const authors = data?.links?.['core/author']?.map((a) => a?.title).join(', ')
  const contentSource = data?.links?.['core/content-source']

  const editorialInfoTypeId = data?.links?.['core/editorial-info-type']?.[0]?.uuid
  const editorialInfoTypeTitle = editorialInfoTypes.find((type) => type.id === editorialInfoTypeId)?.title


  return (
    <div className='flex flex-col gap-6 px-5 py-4 border-t'>
      <InfoBlock text={t('labels.properties')} labelId='properties'>
        <ValueBlock label={t('core:labels.newsvalue')} value={newsvalue} />
        <ValueBlock label={t('labels.byline')} value={authors} />
      </InfoBlock>
      <InfoBlock text={t('labels.tags')} labelId='tags'>
        <ValueBlock label={t('labels.slugg')} value={slugline} />
        <ValueBlock label={t('core:labels.section')} value={section} />
        <ValueBlock label={t('core:labels.category')} value={category} />
        <ValueBlock label={t('core:labels.story')} value={story} />
      </InfoBlock>
      <InfoBlock text={t('labels.version')} labelId='version'>
        <Version documentId={documentId} textOnly={false} />
      </InfoBlock>
      <InfoBlock text={t('labels.extraInformation')} labelId='extraInformation'>
        <ValueBlock label={t('labels.source')} value={(contentSource || []).map((cs) => cs.title).join('-')} />
        <ValueBlock label={t('labels.editorialInfoType')} value={editorialInfoTypeTitle} />
      </InfoBlock>
    </div>
  )
}
