import type { IDBAuthor, StatusMeta } from 'src/datastore/types'

// Return initials created from first letters of first and last name
export const authorOutput = (matchedAuthor: IDBAuthor) => {
  const [first, last] = matchedAuthor.name.split(' ').slice(0, 2)
  return `${first[0]}${last[0]}`
}

/**
 * Displays author names/initials for an approval item.
 *
 * Priority order for displayed value:
 * 1. If `byline` is provided, use it for both initials and full name.
 * 2. Else, if `doneStatus.creator` exists, use the matching author from `authors` (via doneStatusName).
 * 3. Else, if `afterDraftAuthor` is provided, use its name.
 * 4. If `lastStatusUpdateAuthor` is provided, append its initials and name.
 *
 * @param byline - Optional string to override author display.
 * @param doneStatus - StatusMeta object, may contain creator info.
 * @param authors - List of possible authors.
 * @param afterDraftAuthor - Optional author to use after draft.
 * @param lastStatusUpdateAuthor - Optional author to append after status update.
 * @returns JSX.Element displaying initials (with full name as tooltip).
 */
export const AuthorNames = ({
  byline,
  doneStatus,
  afterDraftAuthor,
  authors,
  lastStatusUpdateAuthor
}: {
  byline: string | undefined
  doneStatus: StatusMeta | undefined
  authors: IDBAuthor[]
  afterDraftAuthor?: IDBAuthor
  lastStatusUpdateAuthor?: IDBAuthor
}) => {
  const getAuthorInfo = (author?: IDBAuthor) =>
    author?.name ? { initials: authorOutput(author), full: author.name } : { initials: '', full: '' }

  let initials = ''
  let full = ''

  if (byline) {
    initials = full = byline
  } else {
    const authorObj = doneStatus?.creator
      ? doneStatusName(doneStatus, authors)
      : afterDraftAuthor?.name ? afterDraftAuthor : undefined

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

  const creatorId = doneStatus.creator.slice(doneStatus.creator.lastIndexOf('/'))
  return authors.find((a) => {
    return creatorId === a?.sub?.slice(a?.sub?.lastIndexOf('/'))
  })
}
