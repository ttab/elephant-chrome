import type { AssignmentInterface } from '@/hooks/index/useAssignments'
import { useAuthors } from '@/hooks/useAuthors'
import type { IDBAuthor, StatusData, StatusMeta } from 'src/datastore/types'
import { useMemo } from 'react'

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

  const doneStatus = useMemo(
    () => entries.find((entry) => entry[0] === 'done')?.[1],
    [entries]
  )

  const afterDraftAuthor = useMemo(
    () => getAuthorAfterSetStatus(entries, 'draft', authors),
    [entries, authors]
  )

  const lastStatusUpdateAuthor = useMemo(
    () => authors.find((a) => lastUpdatedById === extractId(a?.sub)),
    [authors, lastUpdatedById]
  )

  let initials = ''
  let full = ''

  if (byline) {
    initials = full = byline
  } else {
    const authorObj = doneStatus?.creator
      ? doneStatusName(doneStatus, authors)
      : afterDraftAuthor?.name
        ? afterDraftAuthor
        : undefined

    if (authorObj) {
      ({ initials, full } = getAuthorInfo(authorObj))
    }
  }

  if (lastStatusUpdateAuthor?.name) {
    const { initials: lastInitials, full: lastFull } = getAuthorInfo(lastStatusUpdateAuthor)
    initials = initials ? `${initials}, ${lastInitials}` : lastInitials
    full = full ? `${full}, ${lastFull}` : lastFull
  }

  return <div title={full}>{initials}</div>
}

function doneStatusName(doneStatus?: StatusMeta, authors?: IDBAuthor[]): IDBAuthor | undefined {
  if (!doneStatus || !authors) return undefined
  const creatorId = extractId(doneStatus.creator)
  return authors.find((a) => creatorId === extractId(a?.sub))
}

function getAuthorInfo(author?: IDBAuthor) {
  return author?.name
    ? { initials: authorOutput(author), full: author.name }
    : { initials: '', full: '' }
}

function getAuthorAfterSetStatus(
  entries: [string, StatusMeta][],
  status: string,
  authors: IDBAuthor[]
) {
  const statusIndex = entries.findIndex((entry) => entry[0] === status)
  const afterStatus = entries[statusIndex - 1]?.[1]
  const creatorId = extractId(afterStatus?.creator)
  return (authors || []).find((a) => creatorId === extractId(a?.sub))
}

function extractId(uri: string = '') {
  return uri.slice(uri.lastIndexOf('/'))
}

export function authorOutput(matchedAuthor: IDBAuthor) {
  const [first = '', last = ''] = matchedAuthor.name.split(' ').slice(0, 2)
  return `${first[0] ?? ''}${last[0] ?? ''}`
}

