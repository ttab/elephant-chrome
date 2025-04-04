import { AssigneeAvatars } from '@/components/DataItem/AssigneeAvatars'
import { TimeDisplay } from '@/components/DataItem/TimeDisplay'
import { AssignmentTypes } from '@/defaults/assignmentTypes'
import { useRegistry } from '@/hooks/useRegistry'
import { Button } from '@ttab/elephant-ui'
import { CalendarIcon, MessageCircleMore, SignalMedium, Tag, Text } from '@ttab/elephant-ui/icons'
import type { EleBlock } from '@/shared/types'
import type { AssignmentData } from '@/components/AssignmentTime/types'
import type { PropsWithChildren } from 'react'

const iconProps = {
  size: 18,
  strokeWidth: 1.75,
  className: 'text-muted-foreground mr-4'
}

const DisabledButton = ({ children }: PropsWithChildren) => {
  return (
    <Button variant='outline' disabled className='text-sm border'>
      {children}
    </Button>
  )
}

export const Slugline = ({ slugline }: { slugline: string }) => {
  return slugline
    ? (
        <div className='flex items-center pb-2'>
          <Tag {...iconProps} />
          <DisabledButton>{slugline}</DisabledButton>
        </div>
      )
    : null
}

export const Description = ({ descriptions }: { descriptions: Array<{ text: string, role: string }> }) => {
  return descriptions?.length > 0
    ? descriptions?.map((d: { text: string, role: string }) => (
      <div key={d.role} className='flex pb-2'>
        <div>
          {d.role === 'internal' ? <MessageCircleMore {...iconProps} /> : <Text {...iconProps} />}
        </div>
        <div className='text-sm border rounded p-2 font-normal text-muted-foreground'>{d.text}</div>
      </div>
    ))
    : null
}

export const Dates = ({ planningDate, eventDate }: { planningDate?: AssignmentData, eventDate?: AssignmentData }) => {
  const { locale, timeZone }: { locale: string, timeZone: string } = useRegistry()

  function formatDate(dateString?: string) {
    if (!dateString || typeof dateString !== 'string') {
      return ''
    }

    return new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone
    }).format(new Date(dateString))
  }

  return (planningDate || eventDate) && (
    <div className='flex items-center pb-2'>
      <CalendarIcon {...iconProps} />
      <DisabledButton>
        {planningDate?.start_date === planningDate?.end_date
          ? formatDate(planningDate?.start_date)
          : `${formatDate(planningDate?.start_date)} - ${formatDate(planningDate?.end_date)}`}
        {eventDate?.start === eventDate?.end
          ? formatDate(eventDate?.start)
          : `${formatDate(eventDate?.start)} - ${formatDate(eventDate?.end)}`}
      </DisabledButton>
    </div>
  )
}

export const Newsvalue = ({ newsvalue }: { newsvalue?: string }) => {
  return newsvalue && (
    <div className='flex items-center pb-2'>
      <DisabledButton>
        <SignalMedium {...iconProps} />
        {newsvalue}
      </DisabledButton>
    </div>
  )
}

export const Section = ({ section }: { section?: string }) => {
  return section && (
    <div className='flex items-center pb-2'>
      <Tag {...iconProps} />
      <DisabledButton>{section}</DisabledButton>
    </div>
  )
}

export const Story = ({ story }: { story?: string }) => {
  return story && (
    <div className='flex items-center pb-2'>
      <DisabledButton>
        {story}
      </DisabledButton>
    </div>
  )
}

export const Category = ({ category }: { category: string[] }) => {
  return category && (
    <div className='flex items-center'>
      <Tag {...iconProps} />
      <div className='flex items-center pb-2 gap-1'>
        {category.map((c) => (
          <DisabledButton key={c}>
            {c}
          </DisabledButton>
        ))}
      </div>
    </div>
  )
}

export const Assignments = ({ assignments, getDescriptions, getSlugline }: {
  assignments: EleBlock[]
  getDescriptions: (block: EleBlock) => Array<{ text: string, role: string }>
  getSlugline: (block: EleBlock) => string
}) => {
  const assignmentType = (block: EleBlock) => block.meta['core/assignment-type']?.[0]?.value
  const getAuthors = (block: EleBlock) => block.links['core/author']?.map((a: EleBlock) => a?.title)

  return assignments?.length > 0 && (
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
  )
}
