import { Card } from '@/components/Card'
import { Avatar, Link } from '@/components/index'
import type { AssignmentInterface } from '@/hooks/index/useAssignments'
import { useLink } from '@/hooks/useLink'
import { CalendarDaysIcon, FileWarningIcon, MessageSquarePlusIcon, ZapIcon } from '@ttab/elephant-ui/icons'
import type { IDBAuthor, StatusData } from 'src/datastore/types'
import { useSections } from '@/hooks/useSections'
import type { StatusSpecification } from '@/defaults/workflowSpecification'
import { useYValue } from '@/hooks/useYValue'
import { AvatarGroup } from '@/components/AvatarGroup'
import { Popover, PopoverContent, PopoverTrigger, Tooltip } from '@ttab/elephant-ui'
import { AuthorNames } from './AuthorNames'
import { CAUSE_KEYS } from '@/defaults/causekeys'
import { useWorkflowStatus } from '@/hooks/useWorkflowStatus'
import { TimeCard } from './TimeCard'

export const ApprovalsCard = ({ assignment, isSelected, isFocused, status, authors, openEditors }: {
  assignment: AssignmentInterface
  status: StatusSpecification
  isSelected: boolean
  isFocused: boolean
  authors: IDBAuthor[]
  openEditors: string[]
}) => {
  const sections = useSections()
  const openArticle = useLink('Editor')
  const openFlash = useLink('Flash')
  const [users] = useYValue<Record<string, { id: string, name: string, username: string }>>(`${assignment._deliverableId}.users`, false, undefined, 'open-documents')
  const [documentStatus] = useWorkflowStatus(assignment._deliverableId, true)

  const openType = (assignmentType: string) => assignmentType === 'core/flash' ? openFlash : openArticle

  const documentId = assignment._deliverableId

  const statusData = assignment?._statusData
    ? JSON.parse(assignment._statusData) as StatusData
    : null
  const entries = statusData ? Object.entries(statusData.heads).sort((a, b) => a[1].created > b[1].created ? -1 : 1) : []


  const lastUpdated = entries?.[0]?.[1]
  const lastUpdatedById = lastUpdated?.creator.slice(lastUpdated?.creator.lastIndexOf('/'))

  const lastStatusUpdateAuthor = authors.find((a) => {
    return lastUpdatedById === a?.sub?.slice(a?.sub?.lastIndexOf('/'))
  })

  const getAuthorAfterSetStatus = (status: string) => {
    const statusIndex = entries.findIndex((entry) => entry[0] === status)
    const afterStatus = entries[statusIndex - 1]?.[1]

    const creatorId = afterStatus?.creator.slice(afterStatus?.creator.lastIndexOf('/'))
    return authors.find((a) => {
      return creatorId === a?.sub?.slice(a?.sub?.lastIndexOf('/'))
    })
  }

  const afterDraftAuthor = getAuthorAfterSetStatus('draft')

  const byline = (assignment?._deliverableDocument?.links ?? [])?.filter((l) => l.type === 'core/author').map((author) => author.title).join(', ')

  const assignees = assignment.links
    .filter((m) => m.type === 'core/author' && m.title)
    .map((l) => l.title)

  const doneStatus = statusData
    ? entries
      ?.find((entry) => entry[0] === 'done')?.[1]
    : undefined

  const title = assignment._deliverableDocument?.title

  const slugline = assignment.meta.find((m) => m.type === 'tt/slugline')?.value
  // heads.usable.id is a bigint counter that represents the version number
  // of the current 'usable' status. Each time a version is tagged as usable,
  // this id is incremented by 1
  const lastUsableOrder = statusData?.heads.usable?.id

  const internalInfo = assignment._deliverableDocument?.meta.find((block) => block.type === 'core/note' && block.role === 'internal')?.data?.text

  const cause = documentStatus?.cause ? CAUSE_KEYS[documentStatus.cause as keyof typeof CAUSE_KEYS].short : ''

  return (
    <Card.Root
      status={assignment._deliverableStatus || 'draft'}
      isFocused={isFocused}
      isSelected={isSelected}
      onSelect={(event) => {
        const openDocument = openType(assignment._deliverableType as string)
        if (event instanceof KeyboardEvent && event.key == ' ' && documentId) {
          openDocument(event, { id: documentId, autoFocus: false }, openEditors.length > 0 ? undefined : 'last', undefined, true)
        } else if (documentId) {
          if (assignment._deliverableStatus === 'usable') {
            const lastUsableVersion = statusData?.heads.usable?.version
            openDocument(event, { id: documentId }, 'last', undefined, undefined, { version: lastUsableVersion as bigint })
          } else {
            openDocument(event, { id: documentId })
          }
        }
      }}
    >
      <Card.Header>
        <div className='flex flex-row gap-2 items-center'>
          {status.icon && <status.icon size={15} strokeWidth={1.75} className={status.className} />}
          <span className='bg-secondary inline-block px-1 rounded'>
            {assignment._deliverableType === 'core/flash'
              ? <ZapIcon strokeWidth={1.75} size={14} className='text-red-500' />
              : assignment._deliverableType === 'core/editorial-info'
                ? <FileWarningIcon size={14} />
                : assignment._newsvalue}
          </span>
          {users && (
            <AvatarGroup size='xxs'>
              {Object.values(users).map((user) => {
                return (
                  <Tooltip key={user.id} content={user.name}>
                    <Avatar value={user.name} size='xxs' className='bg-primary text-white dark:text-black border-none' />
                  </Tooltip>
                )
              })}
            </AvatarGroup>
          )}
          {internalInfo && (
            <Popover>
              <PopoverTrigger onClick={(e) => {
                e.stopPropagation()
              }}
              >
                <Tooltip content={internalInfo}>
                  <div className='hover:bg-gray-300 dark:hover:bg-gray-700 p-1 -m-1 rounded'>
                    <MessageSquarePlusIcon className='opacity-50' size={14} />
                  </div>
                </Tooltip>
              </PopoverTrigger>
              <PopoverContent>{internalInfo}</PopoverContent>
            </Popover>
          )}
        </div>
        <TimeCard assignment={assignment} />
      </Card.Header>

      <Card.Content>
        <Card.Title>
          <div className='truncate'>{title}</div>
          <div className='text-xs font-normal opacity-60 flex gap-1'>
            {slugline && <div>{slugline}</div>}
            {slugline && lastUsableOrder && Number(lastUsableOrder) >= 1 && ('workflowState' in statusData) && !(statusData.workflowState === 'usable' && Number(lastUsableOrder) === 1) && (
              <div>{`- v${statusData?.workflowState !== 'usable' ? Number(lastUsableOrder) + 1 : Number(lastUsableOrder)}`}</div>
            )}
            {cause && <div>{`- ${cause}`}</div>}
          </div>
        </Card.Title>
      </Card.Content>

      <Card.Footer>
        <div className='flex flex-col w-full'>
          <div className='truncate' title={assignees.join(', ')}>
            <AuthorNames
              byline={byline}
              doneStatus={doneStatus}
              assignees={assignees}
              authors={authors}
              afterDraftAuthor={afterDraftAuthor}
              lastStatusUpdateAuthor={lastStatusUpdateAuthor}
            />
          </div>
          <div className='flex grow justify-between align-middle'>
            <div className='flex flex-row content-center opacity-60 gap-1'>
              {sections
                .find((section) => section.id === assignment._section)
                ?.title}

              {assignment._metricsData?.charCount && (
                <span>
                  <span className='pr-1'>
                    &middot;
                  </span>
                  {assignment._metricsData?.charCount}
                  {' '}
                  tkn
                </span>
              )}
            </div>
            <Link
              to='Planning'
              props={{ id: assignment._id }}
              className='block p-1 -m-1 rounded transition-all opacity-70 md:opacity-0 md:group-hover:opacity-70 md:group-focus:opacity-70 md:group-focus-within:opacity-70 hover:bg-gray-300 dark:hover:bg-gray-700'
              onClick={(e) => e.stopPropagation()}
            >
              <Tooltip content='Öppna planering'>
                <CalendarDaysIcon size={16} strokeWidth={1.75} />
              </Tooltip>
            </Link>
          </div>
        </div>
      </Card.Footer>

    </Card.Root>
  )
}
