import { Card } from '@/components/Card'
import { ClockIcon } from '@/components/ClockIcon'
import { Avatar, Link } from '@/components/index'
import { useModal } from '@/components/Modal/useModal'
import { DotDropdownMenu } from '@/components/ui/DotMenu'
import type { AssignmentInterface } from '@/hooks/index/useAssignments'
import { useLink } from '@/hooks/useLink'
import { useRegistry } from '@/hooks/useRegistry'
import { CalendarDays, FileInput, Zap } from '@ttab/elephant-ui/icons'
import { parseISO, format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { PreviewSheet } from '../Wires/components'
import type { IDBAuthor, StatusData } from 'src/datastore/types'
import { useSections } from '@/hooks/useSections'
import type { StatusSpecification } from '@/defaults/workflowSpecification'
import { useYValue } from '@/hooks/useYValue'
import { AvatarGroup } from '@/components/AvatarGroup'
import { Tooltip } from '@ttab/elephant-ui'
import { timesSlots } from '@/defaults/assignmentTimeslots'
import { useMemo } from 'react'
import { makeAuthorNames } from './makeAuthorNames'

export const ApprovalsCard = ({ assignment, isSelected, isFocused, status, authors }: {
  assignment: AssignmentInterface
  status: StatusSpecification
  isSelected: boolean
  isFocused: boolean
  authors: IDBAuthor[]
}) => {
  const { timeZone } = useRegistry()
  const { showModal, hideModal } = useModal()
  const sections = useSections()
  const openArticle = useLink('Editor')
  const openFlash = useLink('Flash')
  const [users] = useYValue<Record<string, { id: string, name: string, username: string }>>(`${assignment._deliverableId}.users`, false, undefined, 'open-documents')

  const openType = (assignmentType: string) => assignmentType === 'core/flash' ? openFlash : openArticle
  const time = useMemo(() =>
    getAssignmentTime(assignment, timeZone), [assignment, timeZone])

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

  const byline = assignment.links.find((l) => l.type === 'core/author')?.title

  const assignees = assignment.links
    .filter((m) => m.type === 'core/author' && m.title)
    .map((l) => l.title)

  const doneStatus = statusData
    ? entries
      ?.find((entry) => entry[0] === 'done')?.[1]
    : undefined

  const authorNames = makeAuthorNames({ byline, assignees, doneStatus, authors, afterDraftAuthor, lastStatusUpdateAuthor })

  const menuItemDocumentLabel = assignment._deliverableType === 'core/flash' ? 'flash' : 'artikel'
  const menuItems = [{
    label: `Öppna ${menuItemDocumentLabel}`,
    icon: FileInput,
    item: (
      <Link
        to={assignment._deliverableType === 'core/flash' ? 'Flash' : 'Editor'}
        props={{ id: documentId }}
      >
        <div className='flex flex-row justify-center items-center'>
          <div className='opacity-70 flex-none w-7'>
            <FileInput size={16} strokeWidth={1.75} />
          </div>

          <div className='grow'>
            {`Öppna ${menuItemDocumentLabel}`}
          </div>
        </div>
      </Link>
    )
  },
  {
    label: 'Öppna planering',
    icon: CalendarDays,
    item: (
      <Link to='Planning' props={{ id: assignment._id }}>
        <div className='flex flex-row justify-center items-center'>
          <div className='opacity-70 flex-none w-7'>
            <CalendarDays size={16} strokeWidth={1.75} />
          </div>

          <div className='grow'>
            Öppna planering
          </div>
        </div>
      </Link>
    )
  }]

  const title = assignment._deliverableDocument?.title

  return (
    <Card.Root
      status={assignment._deliverableStatus || 'draft'}
      isFocused={isFocused}
      isSelected={isSelected}
      onSelect={(event) => {
        if (event instanceof KeyboardEvent && event.key == ' ' && documentId) {
          showModal(
            <PreviewSheet
              id={documentId}
              handleClose={hideModal}
            />
            , 'sheet')
        } else if (documentId) {
          const openDocument = openType(assignment._deliverableType as string)
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
              ? <Zap strokeWidth={1.75} size={14} className='text-red-500' />
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
        </div>

        <div className='flex flex-row gap-1 items-center'>
          <ClockIcon hour={(time) ? parseInt(time.slice(0, 2)) : undefined} size={14} className='opacity-50' />
          <time>{time}</time>
        </div>
      </Card.Header>

      <Card.Content>
        <Card.Title>
          <div className='truncate'>{title}</div>
          <div className='text-xs font-normal opacity-60'>
            {assignment.meta.find((m) => m.type === 'tt/slugline')?.value || ' '}
          </div>
        </Card.Title>
      </Card.Content>

      <Card.Footer>
        <div className='flex flex-col w-full'>
          <div className='truncate' title={assignees.join(', ')}>
            {authorNames}
          </div>
          <div className='flex flex-grow justify-between align-middle'>
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
            <DotDropdownMenu items={menuItems} />
          </div>
        </div>
      </Card.Footer>

    </Card.Root>
  )
}


function getAssignmentTime(assignment: AssignmentInterface, timeZone: string) {
  if (assignment.data.publish && assignment._deliverableStatus === 'withheld') {
    return format(toZonedTime(parseISO(assignment.data.publish), timeZone), 'HH:mm')
  }
  if (assignment.data.publish_slot) {
    return getTimeslotLabel(parseInt(assignment.data.publish_slot))
  }
  if (assignment.data.start) {
    return format(toZonedTime(parseISO(assignment.data.start), timeZone), 'HH:mm')
  }
  return undefined
}

export function getTimeslotLabel(hour: number): string | undefined {
  for (const key in timesSlots) {
    if (timesSlots[key].slots.includes(hour)) {
      return timesSlots[key].label
    }
  }
  return undefined
}
