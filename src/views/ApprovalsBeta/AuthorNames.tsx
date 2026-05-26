import type { PreprocessedApprovalData } from './preprocessor'
import { useAuthors } from '@/hooks/useAuthors'
import { useMemo, type JSX } from 'react'
import { UserIcon, PenIcon, AwardIcon } from 'lucide-react'
import type { IDBAuthor } from 'src/datastore/types'
import type { StatusMeta } from '@/types'
import type { Status, DocumentMeta } from '@ttab/elephant-api/repository'
import { getAuthorBySub } from '@/lib/getAuthorBySub'
import { getDocumentStatuses } from '@/defaults/documentStatuses'
import { useTranslation } from 'react-i18next'
import type { TFunction, Namespace } from 'i18next'
import type { TranslationKey } from '@/types/i18next.d'

export const AuthorNames = ({ item }: { item: PreprocessedApprovalData }): JSX.Element => {
  const authors = useAuthors()
  const { t } = useTranslation()

  const statusData = item._deliverable?.meta || null

  // Memoize sorted status entries
  const entries = useMemo<[string, Status][]>(() => {
    if (!statusData) return []
    return Object.entries(statusData.heads).sort((a, b) =>
      a[1].created > b[1].created ? -1 : 1
    )
  }, [statusData])

  // Get last status update and author
  const lastUpdated = entries[0]?.[1]
  const lastStatusUpdateAuthor = useMemo(
    () => getAuthorBySub(authors, lastUpdated?.creator),
    [authors, lastUpdated?.creator]
  )

  // Get display and full text for tooltip
  const { display, full } = useMemo(
    () => getDisplayAndFull(item, authors, entries, statusData, t),
    [item, authors, entries, statusData, t]
  )

  // Optionally append last status setter if not draft/done
  const enhancedDisplay = useMemo(() => {
    if (!lastStatusUpdateAuthor?.name || !lastUpdated || !statusData?.workflowState) return display

    const lastStatus = getDocumentStatuses().find(
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

    const lastStatus = getDocumentStatuses().find(
      (status) => status.value === statusData.workflowState
    )

    const statusValue = lastStatus?.value

    if (statusValue !== 'draft' && statusValue !== 'done') {
      return full
        ? `${full}, ${t(`core:status.${statusValue}` as TranslationKey)} ${t('shared:authors.from', { author: lastStatusUpdateAuthor.name })}`
        : `${t(`core:status.${statusValue}` as TranslationKey)} ${t('shared:authors.from', { author: lastStatusUpdateAuthor.name })}`
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
function getDisplayAndFull<Ns extends Namespace>(
  item: PreprocessedApprovalData,
  authors: IDBAuthor[],
  entries: [string, Status][],
  statusData: DocumentMeta | null,
  t: TFunction<Ns>
) {
  // Prefer byline from deliverable document
  const byline = (item._deliverable?.document?.links ?? [])
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
      full: t('shared:authors.byline', { author: byline })
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
      full: t('shared:authors.doneBy', { author: authorObj?.name || '??' })
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
      full: t('shared:authors.from', { author: afterDraftAuthor.name })
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
      full: creator?.name ? `${t('shared:authors.createdBy', { author: creator.name })}` : ''
    }
  }

  return { display: null, full: '' }
}

// Find author who set status Done
function doneStatusName(doneStatus?: StatusMeta, authors?: IDBAuthor[]): IDBAuthor | undefined {
  if (!doneStatus || !authors) return undefined
  return getAuthorBySub(authors, doneStatus?.creator)
}

// Find author who set a status, then get the author who set the previous status
function getAuthorAfterSetStatus(
  entries: [string, StatusMeta][],
  status: string,
  authors: IDBAuthor[]
) {
  const statusIndex = entries.findIndex((entry) => entry[0] === status)
  const afterStatus = entries[statusIndex - 1]?.[1]
  return getAuthorBySub(authors, afterStatus?.creator)
}

// Format author name to initials
export function authorOutput(matchedAuthor: IDBAuthor) {
  const [first = '', last = ''] = matchedAuthor.name.split(' ').slice(0, 2)
  return `${first[0] ?? ''}${last[0] ?? ''}`
}
