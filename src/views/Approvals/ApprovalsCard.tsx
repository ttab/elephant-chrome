import { Card } from '@/components/Card'
import { Avatar, Link } from '@/components/index'
import type { AssignmentInterface } from '@/hooks/index/useAssignments'
import { useLink } from '@/hooks/useLink'
import { CalendarDaysIcon, EyeIcon, FileWarningIcon, MessageSquarePlusIcon, ZapIcon } from '@ttab/elephant-ui/icons'
import type { StatusData } from '@/types'
import { useSections } from '@/hooks/useSections'
import type { StatusSpecification } from '@/defaults/workflowSpecification'
import { AvatarGroup } from '@/components/AvatarGroup'
import { Popover, PopoverContent, PopoverTrigger, Tooltip } from '@ttab/elephant-ui'
import { AuthorNames } from './AuthorNames'
import { CAUSE_KEYS } from '@/defaults/causekeys'
import { useWorkflowStatus } from '@/hooks/useWorkflowStatus'
import { TimeCard } from './TimeCard'
import type { TrackedDocument } from '@/hooks/useTrackedDocuments'
import { useTranslation } from 'react-i18next'

export const ApprovalsCard = ({ trackedDocument, assignment, isSelected, isFocused, status, openEditors }: {
  assignment: AssignmentInterface
  status: StatusSpecification
  isSelected: boolean
  isFocused: boolean
  openEditors: string[]
  trackedDocument?: TrackedDocument
}) => {
  const sections = useSections()
  const openArticle = useLink('Editor')
  const openFlash = useLink('Flash')
  const [documentStatus] = useWorkflowStatus({ documentId: assignment._deliverableId })
  const { t } = useTranslation()

  const openType = (assignmentType: string) => assignmentType === 'core/flash' ? openFlash : openArticle

  const documentId = assignment._deliverableId

  const statusData = assignment?._statusData
    ? JSON.parse(assignment._statusData) as StatusData
    : null

  const title = assignment._deliverableDocument?.title

  const slugline = assignment.meta.find((m) => m.type === 'tt/slugline')?.value
  const lastUsableOrder = statusData?.heads.usable?.id

  const internalInfo = assignment._deliverableDocument?.meta.find((block) => block.type === 'core/note' && block.role === 'internal')?.data?.text

  const cause = documentStatus?.cause ? CAUSE_KEYS[documentStatus.cause as keyof typeof CAUSE_KEYS].short : ''

  return (
    <Card.Root
      status={assignment._deliverableStatus || 'draft'}
      isFocused={isFocused}
      isSelected={isSelected}
      onSelect={(event) => {
        const openDocument = openType(assignment._deliverableType!)

        if (event instanceof KeyboardEvent && event.key == ' ' && documentId) {
          openDocument(event, { id: documentId, autoFocus: false, preview: true }, openEditors.length > 0 ? undefined : 'last', undefined, true)
        } else if (documentId) {
          if (assignment._deliverableStatus === 'usable') {
            const lastUsableVersion = statusData?.heads.usable?.version
            openDocument(event, { id: documentId, preview: false }, 'last', undefined, undefined, { version: lastUsableVersion as bigint })
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
          {!!trackedDocument?.users?.length && (
            <AvatarGroup size='xxs'>
              {Object.values(trackedDocument.users).map((user) => {
                return (
                  <Tooltip key={user.id} content={user.name}>
                    <Avatar value={user.name} size='xxs' className='bg-primary border-none text-white dark:text-slate-500' />
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
                  <div className='hover:bg-gray-300 dark:hover:bg-table-focused p-1 -m-1 rounded'>
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
          <div className='truncate'>
            <AuthorNames assignment={assignment} />
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
                  {t('views.approvals.charactersShort')}
                </span>
              )}
            </div>

            <div className='flex flex-row gap-3'>
              <Link
                to={assignment._deliverableType === 'core/flash' ? 'Flash' : 'Editor'}
                props={{ id: assignment._deliverableId, autoFocus: false, preview: true }}
                className='block p-1 -m-1 rounded transition-all opacity-70 md:opacity-0 md:group-hover:opacity-70 md:group-focus:opacity-70 md:group-focus-within:opacity-70 hover:bg-gray-300 dark:hover:bg-table-focused'
                keepFocus
                onClick={(e) => e.stopPropagation()}
              >
                <Tooltip content={t('views.approvals.tooltips.openPreview')}>
                  <EyeIcon size={16} strokeWidth={1.75} />
                </Tooltip>
              </Link>
              <Link
                to='Planning'
                props={{ id: assignment._id }}
                className='block p-1 -m-1 rounded transition-all opacity-70 md:opacity-0 md:group-hover:opacity-70 md:group-focus:opacity-70 md:group-focus-within:opacity-70 hover:bg-gray-300 dark:hover:bg-table-focused'
                onClick={(e) => e.stopPropagation()}
              >
                <Tooltip content={t('views.approvals.tooltips.openPlanning')}>
                  <CalendarDaysIcon size={16} strokeWidth={1.75} />
                </Tooltip>
              </Link>
            </div>
          </div>
        </div>
      </Card.Footer>

    </Card.Root>
  )
}
