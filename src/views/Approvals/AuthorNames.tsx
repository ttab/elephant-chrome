import type { IDBAuthor } from 'src/datastore/types'
import type { StatusMeta } from '@/types'
import { DoneMarkedBy } from './DoneMarkedBy'

export const authorOutput = (matchedAuthor: IDBAuthor) => {
  if (matchedAuthor.initials && matchedAuthor.initials.length > 0) {
    return matchedAuthor.initials
  }
  const [first, last] = matchedAuthor.name.split(' ').slice(0, 2)
  return `${first[0]}${last[0]}`
}

/**
     * Names are displayed using this order of priority:
     * 1. If there is a byline, output the byline
     * 2. If there is no byline, output the signature of each assignee
     * 3. If there are no assignees, output the initials whoever marked the deliverable as 'done'
     * 4. The user who changes status from draft to something else is to be output first
     * 5. Whoever updates the status after that is to be output next
     *    Could be the same as the reporter, in that case don't bother outputting it again
  */
export const AuthorNames = ({
  byline,
  doneStatus,
  authors,
  assignees,
  afterDraftAuthor,
  lastStatusUpdateAuthor
}: {
  byline: string | undefined
  doneStatus: StatusMeta | undefined
  assignees: string[]
  authors: IDBAuthor[]
  afterDraftAuthor?: IDBAuthor
  lastStatusUpdateAuthor?: IDBAuthor
}) => {
  if (byline) {
    return byline
  }

  if (!byline) {
    if (assignees.length === 0 && doneStatus) {
      return <DoneMarkedBy doneStatus={doneStatus} authors={authors} />
    }

    if (assignees.length >= 1) {
      let initials = ''
      let full = ''

      if (afterDraftAuthor?.name) {
        initials += authorOutput(afterDraftAuthor)
        full += afterDraftAuthor.name

        if (lastStatusUpdateAuthor?.name && (afterDraftAuthor?.name !== lastStatusUpdateAuthor.name)) {
          initials += `, ${authorOutput(lastStatusUpdateAuthor)}`
          full += `, ${lastStatusUpdateAuthor.name}`
        }
      }

      if (!afterDraftAuthor?.name && lastStatusUpdateAuthor?.name) {
        initials += authorOutput(lastStatusUpdateAuthor)
        full += lastStatusUpdateAuthor.name
      }

      return <div title={full}>{initials}</div>
    }
    return <></>
  }
}
