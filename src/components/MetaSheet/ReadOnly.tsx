import { Label } from '@ttab/elephant-ui'
import { Version } from '@/components/Version'
import { OriginLinks } from '@/components/OriginLinks'
import type { ReactNode } from 'react'
import { useDeliverableInfo } from '@/hooks/useDeliverableInfo'
import { useDocumentSnapshot } from '@/hooks'
import { useEditorialInfoTypes } from '@/hooks/useEditorialInfoType'
import { useTranslation } from 'react-i18next'

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

  const { data, error } = useDocumentSnapshot({ id: documentId, version })

  const sourceDocument = data?.links?.['core/article']?.find((l) => l.rel === 'source-document')
    ?? data?.links?.['core/article#timeless']?.find((l) => l.rel === 'source-document')
  const sourcePlanningId = useDeliverableInfo(sourceDocument?.uuid ?? '')?.planningUuid

  if (error) {
    return (
      <div className='px-5 py-4 border-t text-sm text-muted-foreground'>
        {t('errors:messages.failedToLoadMetaData')}
      </div>
    )
  }

  const isTimeless = data?.type === 'core/article#timeless'
  const timelessCategory = data?.links?.['core/timeless-category']?.[0]?.title
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
      {isTimeless && timelessCategory && (
        <InfoBlock text={t('labels.category')} labelId='timeless-category'>
          <div className='text-sm font-bold'>{timelessCategory}</div>
        </InfoBlock>
      )}
      <InfoBlock text={t('labels.tags')} labelId='tags'>
        <ValueBlock label={t('labels.slugline')} value={slugline} />
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
      {sourceDocument?.uuid && (
        <InfoBlock text={t('labels.origin')} labelId='origin'>
          <OriginLinks
            sourceUuid={sourceDocument.uuid}
            sourceType={sourceDocument.type === 'core/article' ? 'core/article' : 'core/article#timeless'}
            sourcePlanningId={sourcePlanningId}
          />
        </InfoBlock>
      )}
    </div>
  )
}
