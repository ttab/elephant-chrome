import { Check } from '@ttab/elephant-ui/icons'
import { useAuthors } from '@/hooks/useAuthors'
import type { StatusMeta } from 'src/datastore/types'
import { dateToReadableDateTime } from '@/lib/datetime'
import { useRegistry } from '@/hooks/useRegistry'
import { Tooltip } from '@ttab/elephant-ui'

export const DoneMarkedBy = ({ doneStatus }: {
  doneStatus: StatusMeta | undefined
}) => {
  const authors = useAuthors()
  const { locale, timeZone } = useRegistry()
  if (!doneStatus?.creator) {
    return <></>
  }
  const creatorId = doneStatus.creator.slice(doneStatus.creator.lastIndexOf('/'))
  const matchedAuthor = authors.find((a) => {
    return creatorId === a.sub.slice(a.sub.lastIndexOf('/'))
  })?.name

  if (!matchedAuthor) {
    return <></>
  }

  const created = dateToReadableDateTime(new Date(doneStatus.created), locale, timeZone)

  return (
    <div className='flex flex-col items-start justify-start'>
      <Tooltip content={`Senast klarmarkerat ${created}`}>
        <div className='flex gap-1 items-center relative'>
          <Check size={16} />
          <div>{`${matchedAuthor}`}</div>
        </div>
      </Tooltip>
    </div>
  )
}
