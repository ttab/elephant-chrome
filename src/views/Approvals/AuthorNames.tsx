import type { AssignmentInterface } from '@/hooks/index/useAssignments'
import { useAuthors } from '@/hooks/useAuthors'
import { useMemo, type JSX } from 'react'
import { UserIcon, PenIcon, AwardIcon } from 'lucide-react'
import type { IDBAuthor } from 'src/datastore/types'
import type { StatusMeta } from '@/types'
import type { Status, StatusOverviewItem } from '@ttab/elephant-api/repository'
import { getAuthorBySub } from '@/lib/getAuthorBySub'
import { DocumentStatuses } from '@/defaults/documentStatuses'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'

export const AuthorNames = ({ assignment }: { assignment: AssignmentInterface }): JSX.Element => {
  const authors = useAuthors()
  const { t } = useTranslation()

  // Parse status data only if it exists and changes
  const statusData = useMemo<StatusOverviewItem | null>(() => {
    if (!assignment?._statusData) return null
    try {
      return JSON.parse(assignment._statusData) as StatusOverviewItem
    } catch {
      return null
    }
  }, [assignment?._statusData])

  // Memoize sorted status entries
  const entries = useMemo<[string, Status][]>(() => {
    if (!statusData) return []
    return Object.entries(statusData.heads).sort((a, b) =>
      a[1].created > b[1].created ? -1 : 1
    )
  }, [statusData])

  // Get last status update and author
  const lastUpdated = entries[0]?.[1]
  const lastUpdatedById = useMemo(() => extractId(lastUpdated?.creator), [lastUpdated])
  const lastStatusUpdateAuthor = useMemo(() =>
    authors.find((a) => lastUpdatedById && lastUpdatedById === extractId(a?.sub)),
  [authors, lastUpdatedById])

  // Get display and full text for tooltip
  const { display, full } = useMemo(
    () => getDisplayAndFull(assignment, authors, entries, statusData, t),
    [assignment, authors, entries, statusData, t]
  )

  // Optionally append last status setter if not draft/done
  const enhancedDisplay = useMemo(() => {
    if (!lastStatusUpdateAuthor?.name || !lastUpdated || !statusData?.workflowState) return display

    const lastStatus = DocumentStatuses.find(
      (status) => status.value === statusData.workflowState
    )
    const Icon = lastStatus?.icon ?? AwardIcon
    const statusValue = lastStatus?.value

    if (statusValue !== 'draft' && statusValue !== 'done') {
      return (
        <>
          {display}
          <span className='flex gap-0.5 items-center'>
            {Icon && <Icon size={14} className='-mt-0.5' />}
            <span>{authorOutput(lastStatusUpdateAuthor)}</span>
          </span>
        </>
      )
    }
    return display
  }, [display, lastStatusUpdateAuthor, lastUpdated, statusData])

  const enhancedFull = useMemo(() => {
    if (!lastStatusUpdateAuthor?.name || !lastUpdated || !statusData?.workflowState) return full

    const lastStatus = DocumentStatuses.find(
      (status) => status.value === statusData.workflowState
    )

    const statusValue = lastStatus?.value

    if (statusValue !== 'draft' && statusValue !== 'done') {
      return full
        ? `${full}, ${t('core.statuses.' + statusValue)} ${t('shared.authors.from', { author: lastStatusUpdateAuthor.name })}`
        : `${t('core.statuses.' + statusValue)} ${t('shared.authors.from', { author: lastStatusUpdateAuthor.name })}`
    }
    return full
  }, [full, lastStatusUpdateAuthor, lastUpdated, statusData, t])

  return (
    <div title={enhancedFull}>
      <span className='flex flex-row gap-2 items-center'>{enhancedDisplay}</span>
    </div>
  )
}

// Helper to get display and full tooltip text
function getDisplayAndFull(
  assignment: AssignmentInterface,
  authors: IDBAuthor[],
  entries: [string, Status][],
  statusData: StatusOverviewItem | null,
  t: TFunction<string>
) {
  // Prefer byline from deliverable document
  const byline = (assignment?._deliverableDocument?.links ?? [])
    .filter((l) => l.type === 'core/author')
    .map((author) => author.title)
    .join(', ')

  if (byline) {
    return {
      display: (
        <span className='flex items-center gap-0.5'>
          <UserIcon size={14} className='-mt-0.5' />
          <span>{byline}</span>
        </span>
      ),
      full: t('shared.authors.byline', { author: byline })
    }
  }

  // Show author who set status Done
  const doneStatus = entries.find((entry) => entry[0] === 'done')?.[1]
  if (doneStatus) {
    const authorObj = doneStatusName(doneStatus, authors)
    return {
      display: (
        <span className='flex items-center gap-0.5'>
          <PenIcon size={14} className='-mt-0.5' />
          <span>{authorObj ? authorOutput(authorObj) : '??'}</span>
        </span>
      ),
      full: t('shared.authors.doneBy', { author: authorObj?.name || '??' })
    }
  }

  // Show author who moved out of draft
  const afterDraftAuthor = getAuthorAfterSetStatus(entries, 'draft', authors)
  if (afterDraftAuthor?.name) {
    return {
      display: (
        <span className='flex items-center gap-0.5'>
          <PenIcon size={14} className='-mt-0.5' />
          <span>{authorOutput(afterDraftAuthor)}</span>
        </span>
      ),
      full: t('shared.authors.from', { author: afterDraftAuthor.name })
    }
  }

  // Show author who created a new version after 'usable'
  const afterUsableAuthor = getAuthorAfterSetStatus(entries, 'usable', authors)
  if (afterUsableAuthor?.name) {
    return {
      display: (
        <span className='flex items-center gap-0.5'>
          <PenIcon size={14} className='-mt-0.5' />
          <span>{authorOutput(afterUsableAuthor)}</span>
        </span>
      ),
      full: afterUsableAuthor.name
    }
  }

  // Show creator of deliverable
  if (statusData?.creatorUri) {
    const creator = getAuthorBySub(authors, statusData.creatorUri)
    return {
      display: (
        <span className='flex items-center gap-0.5'>
          <PenIcon size={14} className='-mt-0.5' />
          <span>{creator ? authorOutput(creator) : '??'}</span>
        </span>
      ),
      full: creator?.name ? `${t('shared.authors.createdBy', { author: creator.name })}` : ''
    }
  }

  return { display: null, full: '' }
}

// Find author who set status Done
function doneStatusName(doneStatus?: StatusMeta, authors?: IDBAuthor[]): IDBAuthor | undefined {
  if (!doneStatus || !authors) return undefined
  const creatorId = extractId(doneStatus.creator)
  return authors.find((a) => creatorId === extractId(a?.sub))
}

// Find author who set a status, then get the author who set the previous status
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

// Extract ID from URI
function extractId(uri: string = '') {
  return uri.slice(uri.lastIndexOf('/'))
}

// Format author name to initials
export function authorOutput(matchedAuthor: IDBAuthor) {
  const [first = '', last = ''] = matchedAuthor.name.split(' ').slice(0, 2)
  return `${first[0] ?? ''}${last[0] ?? ''}`
}
