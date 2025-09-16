import type { AssignmentInterface } from '@/hooks/index/useAssignments'
import { useAuthors } from '@/hooks/useAuthors'
import type { IDBAuthor, StatusData, StatusMeta } from 'src/datastore/types'
import { useMemo } from 'react'
import { UserIcon, PenIcon, AwardIcon } from 'lucide-react'

export const AuthorNames = ({ assignment }: { assignment: AssignmentInterface }): JSX.Element => {
  const authors = useAuthors()

  const statusData = useMemo(
    () => assignment?._statusData ? JSON.parse(assignment._statusData) as StatusData : null,
    [assignment?._statusData]
  )

  const entries = useMemo(
    () =>
      statusData
        ? Object.entries(statusData.heads).sort((a, b) => a[1].created > b[1].created ? -1 : 1)
        : [],
    [statusData]
  )

  const lastUpdated = entries[0]?.[1]
  const lastUpdatedById = useMemo(() => extractId(lastUpdated?.creator), [lastUpdated])

  const byline = useMemo(
    () =>
      (assignment?._deliverableDocument?.links ?? [])
        .filter((l) => l.type === 'core/author')
        .map((author) => author.title)
        .join(', '),
    [assignment?._deliverableDocument?.links]
  )

  const doneStatus = useMemo(() => entries.find((entry) => entry[0] === 'done')?.[1],
    [entries]
  )

  const afterDraftAuthor = useMemo(
    () => getAuthorAfterSetStatus(entries, 'draft', authors),
    [entries, authors]
  )

  const lastStatusUpdateAuthor = useMemo(
    () => authors.find((a) => lastUpdatedById && lastUpdatedById === extractId(a?.sub)),
    [authors, lastUpdatedById]
  )

  let display: React.ReactNode = null
  let full = ''

  if (byline) {
    display = (
      <span className='flex items-center'>
        <UserIcon size={14} />
        <span>{byline}</span>
      </span>
    )
    full = byline
  } else if (doneStatus) {
    const authorObj = doneStatusName(doneStatus, authors)
    if (authorObj) {
      display = (
        <span className='flex items-center'>
          <PenIcon size={14} />
          <span>{authorOutput(authorObj)}</span>
        </span>
      )
      full = authorObj.name
    }
  } else if (afterDraftAuthor?.name) {
    display = (
      <span className='flex items-center'>
        <PenIcon size={14} />
        <span>{authorOutput(afterDraftAuthor)}</span>
      </span>
    )
    full = afterDraftAuthor.name
  }

  if (lastStatusUpdateAuthor?.name && lastUpdated) {
    display = (
      <>
        {display && (
          display
        )}
        <span className='flex items-center'>
          <AwardIcon size={14} />
          <span>{authorOutput(lastStatusUpdateAuthor)}</span>
        </span>
      </>
    )
    full = full ? `${full}, ${lastStatusUpdateAuthor.name}` : lastStatusUpdateAuthor.name
  }

  return (
    <div title={full}>
      <span className='flex flex-row gap-2 items-center'>
        {display}
      </span>
    </div>
  )
}

function doneStatusName(doneStatus?: StatusMeta, authors?: IDBAuthor[]): IDBAuthor | undefined {
  if (!doneStatus || !authors) return undefined
  const creatorId = extractId(doneStatus.creator)
  return authors.find((a) => creatorId === extractId(a?.sub))
}

function getAuthorAfterSetStatus(
  entries: [string, StatusMeta][],
  status: string,
  authors: IDBAuthor[]
) {
  const statusIndex = entries.findIndex((entry) => entry[0] === status)
  const afterStatus = entries[statusIndex - 1]?.[1]
  const creatorId = extractId(afterStatus?.creator)
  return (authors || []).find((a) => creatorId && creatorId === extractId(a?.sub))
}

function extractId(uri: string = '') {
  return uri.slice(uri.lastIndexOf('/'))
}

export function authorOutput(matchedAuthor: IDBAuthor) {
  const [first = '', last = ''] = matchedAuthor.name.split(' ').slice(0, 2)
  return `${first[0] ?? ''}${last[0] ?? ''}`
}
