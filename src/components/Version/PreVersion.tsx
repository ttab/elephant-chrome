import { PreVersionInfo } from './PreVersionInfo'
import type { DocumentVersion } from '@ttab/elephant-api/repository'
import type { EleBlock, EleDocument } from '@/shared/types'
import { useCallback } from 'react'
import { Description, Assignments, Category, Dates, Slugline, Section, Story, Newsvalue } from './components'

export const PreVersion = ({
  content,
  version,
  versionHistory
}: {
  content: EleDocument
  version: bigint | undefined
  versionHistory?: DocumentVersion[]
}) => {
  const getDescriptions = useCallback((block: EleDocument | EleBlock) => {
    if (!block) {
      return []
    }
    if ('meta' in block) {
      return block?.meta?.['core/description']
        ?.filter((desc: EleBlock) => desc?.data?.text?.length > 0)
        ?.map((desc: EleBlock) => ({ text: desc.data.text, role: desc.role }))
    }
    return []
  }, [])

  const getSlugline = useCallback((block: EleBlock): string => {
    if (block) {
      return 'value' in block ? block?.value : ''
    }
    return ''
  }, [])

  const descriptions = getDescriptions(content)
  const planningDate = content.meta['core/planning-item']?.[0]?.data
  const eventDate = content.meta['core/event']?.[0]?.data
  const slugline = getSlugline(content?.meta?.['tt/slugline']?.[0])
  const newsvalue = content.meta['core/newsvalue']?.[0]?.value
  const assignments = content.meta['core/assignment']?.map((a: EleBlock) => a)
  const section = content.links['core/section']?.find((a: EleBlock) => a)?.title
  const story = content.links['core/story']?.find((a: EleBlock) => a)?.title
  const category = content.links['core/category']?.map((a: EleBlock) => a.title)

  return (
    <div className='flex justify-center overflow-y-auto select-none'>
      <div className='w-3/4'>
        <PreVersionInfo version={version} versionHistory={versionHistory} />
        <div className='font-sans font-bold text-xl pb-2 text-muted-foreground'>{content.title}</div>
        <Description descriptions={descriptions} />
        <Slugline slugline={slugline} />

        <div className='flex items-center gap-2'>
          <Dates planningDate={planningDate} />
          <Dates eventDate={eventDate} />
          <Newsvalue newsvalue={newsvalue} />
        </div>

        <div className='flex items-center gap-2'>
          <Section section={section} />
          <Story story={story} />
        </div>

        <Category category={category} />
        <Assignments assignments={assignments} getDescriptions={getDescriptions} getSlugline={getSlugline} />
      </div>
    </div>
  )
}
