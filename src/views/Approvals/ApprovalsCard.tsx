import { Card } from '@/components/Card'
import { ClockIcon } from '@/components/ClockIcon'
import { Link } from '@/components/index'
import { useModal } from '@/components/Modal/useModal'
import { DotDropdownMenu } from '@/components/ui/DotMenu'
import type { AssignmentInterface } from '@/hooks/index/useAssignments'
import { useLink } from '@/hooks/useLink'
import { useRegistry } from '@/hooks/useRegistry'
import type { DefaultValueOption } from '@/types/index'
import { CalendarDays, FileInput } from '@ttab/elephant-ui/icons'
import { parseISO, format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { ModalContent } from '../Wires/components'
import { useActiveUsers } from '@/hooks/useActiveUsers'
import { AssigneeAvatars } from '@/components/DataItem/AssigneeAvatars'


export const ApprovalsCard = ({ assignment, isSelected, isFocused, status }: {
  assignment: AssignmentInterface
  status: DefaultValueOption
  isSelected: boolean
  isFocused: boolean
}) => {
  const { timeZone } = useRegistry()
  const { showModal, hideModal } = useModal()
  const openArticle = useLink('Editor')
  const time = assignment.data.publish
    ? format(toZonedTime(parseISO(assignment.data.publish), timeZone), 'HH:mm')
    : undefined
  const articleId = assignment._deliverableId
  const assignees = assignment.links.filter((m) => m.type === 'core/author' && m.title).map((l) => l.title)
  const activeUsers = useActiveUsers(articleId ? [articleId] : [])
  const activeUsersNames = activeUsers?.[assignment._deliverableId]?.map((u) => u.name) || []

  const menuItems = [{
    label: 'Öppna artikel',
    icon: FileInput,
    item: (
      <Link to='Editor' props={{ id: articleId }}>
        <div className='flex flex-row justify-center items-center'>
          <div className='opacity-70 flex-none w-7'>
            <FileInput size={16} strokeWidth={1.75} />
          </div>

          <div className='grow'>
            Öppna artikel
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

  return (
    <Card.Root
      status={assignment._deliverableStatus || 'draft'}
      isFocused={isFocused}
      isSelected={isSelected}
      onSelect={(event) => {
        if (event instanceof KeyboardEvent && event.key == ' ' && articleId) {
          showModal(
            <ModalContent
              id={articleId}
              handleClose={hideModal}
            />
            , 'sheet')
        } else if (articleId) {
          openArticle(event, { id: articleId })
        }
      }}
    >
      <Card.Header>
        <div className='flex flex-row gap-2 items-center'>
          {status.icon && <status.icon {...status.iconProps} size={15} />}
          <span className='bg-secondary inline-block px-1 rounded'>{assignment._newsvalue}</span>
          {!!activeUsersNames.length && (
            <AssigneeAvatars assignees={activeUsersNames} size='xxs' color='default' />
          )}
        </div>

        <div className='flex flex-row gap-1 items-center'>
          <ClockIcon hour={(time) ? parseInt(time.slice(0, 2)) : undefined} size={14} className='opacity-50' />
          <time>{time}</time>
        </div>
      </Card.Header>

      <Card.Content>
        <Card.Title>
          <div className='truncate'>{assignment._deliverableDocument?.title || assignment.title}</div>
          <div className='text-xs font-normal opacity-60'>
            {assignment.meta.find((m) => m.type === 'tt/slugline')?.value || ' '}
          </div>
        </Card.Title>
      </Card.Content>

      <Card.Footer>
        <div className='flex flex-col w-full'>
          <div className='truncate'>
            {!assignees.length && '-'}
            {assignees.length === 1 && assignees[0]}
            {assignees.length > 2 && `${assignees.join(', ')}`}
          </div>
          <div className='flex flex-grow justify-between align-middle'>
            <div className='content-center opacity-60'>
              {assignment._section}
              &middot;
              1024 tkn
            </div>
            <DotDropdownMenu items={menuItems} />
          </div>

        </div>
      </Card.Footer>

    </Card.Root>
  )
}