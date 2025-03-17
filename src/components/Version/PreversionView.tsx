import { AssignmentTypes } from '@/defaults/assignmentTypes'
import { useRegistry } from '@/hooks/useRegistry'
import { Button } from '@ttab/elephant-ui'
import { CalendarIcon, MessageCircleMore, Text, Tag, SignalMedium } from '@ttab/elephant-ui/icons'
import { AssigneeAvatars } from '../DataItem/AssigneeAvatars'
import { TimeDisplay } from '../DataItem/TimeDisplay'
import type { DocumentVersion } from '@ttab/elephant-api/repository'
import type { EleBlock, EleDocument } from '@/shared/types'
import type { AssignmentMeta } from '@/views/Assignments/types'
import { PreversionViewInfo } from './PreversionViewInfo'

export const PreversionView = ({
  content,
  previewVersion,
  versionHistory
}: {
  content: EleDocument
  previewVersion: bigint | undefined
  versionHistory?: DocumentVersion[]
}) => {
  const { locale, timeZone } = useRegistry()

  function getDescriptions(block: EleDocument | EleBlock) {
    if (!block) {
      return []
    }
    if ('meta' in block) {
      return block?.meta?.['core/description']
        ?.filter((desc: EleBlock) => desc?.data?.text?.length > 0)
        ?.map((desc: EleBlock) => ({ text: desc.data.text, role: desc.role }))
    }
    return []
  }

  function getSlugline(block: EleBlock | AssignmentMeta): string {
    if (block) {
      return 'value' in block ? block?.value : ''
    }
    return ''
  }

  function formatDate(dateString: string) {
    if (!dateString) {
      return ''
    }

    return new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone
    }).format(new Date(dateString))
  }

  const assignmentType = (block: EleBlock) => block.meta['core/assignment-type']?.[0]?.value
  const getAuthors = (block: EleBlock) => block.links['core/author']?.map((a: EleBlock) => a?.title)

  const descriptions = getDescriptions(content)
  const planningDate = content.meta['core/planning-item']?.[0]?.data
  const eventDate = content.meta['core/event']?.[0]?.data
  const slugline = getSlugline(content?.meta?.['tt/slugline']?.[0])
  const newsvalue = content.meta['core/newsvalue']?.[0]?.value
  const assignments = content.meta['core/assignment']?.map((a: EleBlock) => a)
  const section = content.links['core/section']?.find((a: EleBlock) => a)?.title
  const story = content.links['core/story']?.find((a: EleBlock) => a)?.title
  const category = content.links['core/category']?.map((a: EleBlock) => a.title)

  const iconProps = {
    size: 18,
    strokeWidth: 1.75,
    className: 'text-muted-foreground mr-4'
  }

  return (
    <div className='flex justify-center overflow-y-auto select-none'>
      <div className='w-3/4'>
        <PreversionViewInfo previewVersion={previewVersion} versionHistory={versionHistory} />
        <div className='font-sans font-bold text-xl pb-2 text-muted-foreground'>{content.title}</div>
        {descriptions?.length > 0 && descriptions?.map((d: { text: string, role: string }) => (
          <div key={d.role} className='flex pb-2'>
            <div>
              {d.role === 'internal'
                ? (
                    <MessageCircleMore {...iconProps} />
                  )
                : (
                    <Text {...iconProps} />)}
            </div>
            <div className='text-sm border rounded p-2 font-normal text-muted-foreground'>{d.text}</div>
          </div>
        ))}
        {slugline && (
          <div className='flex items-center pb-2'>
            <Tag {...iconProps} />
            <Button variant='outline' disabled className='text-sm border'>{slugline}</Button>
          </div>
        )}
        <div className='flex items-center gap-2'>
          {planningDate && (
            <div className='flex items-center pb-2'>
              <CalendarIcon {...iconProps} />
              <Button
                variant='outline'
                disabled
                className='text-sm border'
              >
                {planningDate.start_date === planningDate.end_date
                  ? formatDate(planningDate?.start_date)
                  : `${formatDate(planningDate?.start_date)} - ${formatDate(planningDate?.end_date)}`}
              </Button>
            </div>
          )}
          {eventDate && (
            <div className='flex items-center pb-2'>
              <CalendarIcon {...iconProps} />
              <Button
                variant='outline'
                disabled
                className='text-sm border'
              >
                {eventDate.start === eventDate.end
                  ? formatDate(eventDate?.start)
                  : `${formatDate(eventDate?.start)} - ${formatDate(eventDate?.end)}`}
              </Button>
            </div>
          )}
          {newsvalue && (
            <div className='flex items-center pb-2'>
              <Button variant='outline' className='text-sm border' disabled>
                <SignalMedium {...iconProps} />
                {newsvalue}
              </Button>
            </div>
          )}
        </div>
        <div className='flex items-center gap-2'>
          {section && (
            <div className='flex items-center pb-2'>
              <Tag {...iconProps} />
              <Button variant='outline' disabled className='text-sm border'>{section}</Button>
            </div>
          )}
          {story && (
            <div className='flex items-center pb-2'>
              <Button variant='outline' className='text-sm border' disabled>
                {story}
              </Button>
            </div>
          )}
        </div>
        {category && (
          <div className='flex items-center'>
            <Tag {...iconProps} />
            <div className='flex items-center pb-2 gap-1'>
              {category.map((c) => (
                <Button key={c} variant='outline' className='text-sm border' disabled>
                  {c}
                </Button>
              ))}
            </div>
          </div>
        )}

        {assignments?.length > 0 && (
          <div className='flex-row gap-2 pb-2'>
            {assignments.map((a: EleBlock) => {
              const IconType = AssignmentTypes.find((type) => type.value === assignmentType(a))?.icon
              const assignmentSlugline = getSlugline(a.meta['tt/slugline']?.[0])
              const assignmentPublish = a.data.publish

              return (
                <div
                  key={a.id}
                  className='border rounded p-2'
                >
                  <div className='flex gap-2 items-center justify-between pb-2'>
                    <div className='flex items-center gap-2'>
                      {IconType && <IconType size={18} />}
                      {getAuthors(a)?.length > 0 && <AssigneeAvatars assignees={getAuthors(a)} />}
                      {assignmentSlugline && <div className='text-sm text-muted-foreground rounded border p-1 w-fit'>{assignmentSlugline}</div>}
                    </div>
                    <div>
                      {assignmentPublish && (
                        <TimeDisplay date={new Date(assignmentPublish)} className='text-muted-foreground' />
                      )}
                    </div>
                  </div>
                  <div className='font-sans font-bold pb-2 text-muted-foreground'>{a.title}</div>
                  {getDescriptions(a)?.map((desc: { role: string, text: string }) => (
                    <div key={desc.role} className='text-sm font-normal text-muted-foreground'>{desc?.text}</div>
                  ))}
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
