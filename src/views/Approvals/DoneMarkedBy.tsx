import { CheckIcon } from '@ttab/elephant-ui/icons'
import type { IDBAuthor } from 'src/datastore/types'
import type { StatusMeta } from '@/types'
import { dateToReadableDateTime } from '@/shared/datetime'
import { useRegistry } from '@/hooks/useRegistry'
import { Tooltip } from '@ttab/elephant-ui'
import { authorOutput } from './AuthorNames'
import { useTranslation } from 'react-i18next'

export const DoneMarkedBy = ({ doneStatus, authors }: {
  doneStatus: StatusMeta | undefined
  authors: IDBAuthor[]
}) => {
  const { locale, timeZone } = useRegistry()
  const { t } = useTranslation()

  if (!doneStatus?.creator) {
    return <></>
  }

  const creatorId = doneStatus.creator.slice(doneStatus.creator.lastIndexOf('/'))
  const matchedAuthor = authors.find((a) => {
    return creatorId === a?.sub?.slice(a?.sub?.lastIndexOf('/'))
  })

  if (!matchedAuthor) {
    return <></>
  }

  const created = dateToReadableDateTime(new Date(doneStatus.created), locale.code.full, timeZone)

  const author = authorOutput(matchedAuthor)

  return (
    <div className='flex flex-col items-start justify-start'>
      <Tooltip content={`${t('views.approvals.tooltips.lastDoneMarkedAuthor', { created: created, author: matchedAuthor.name })}`}>
        <div className='flex gap-1 items-center relative'>
          <CheckIcon size={16} />
          <div>{author}</div>
        </div>
      </Tooltip>
    </div>
  )
}
