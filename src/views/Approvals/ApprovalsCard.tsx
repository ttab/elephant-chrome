import { Card } from '@/components/Card'
import { Avatar, Link } from '@/components/index'
import type { PreprocessedApprovalData } from './preprocessor'
import { useLink } from '@/hooks/useLink'
import { CalendarDaysIcon, EyeIcon, FileWarningIcon, MessageSquarePlusIcon, ZapIcon } from '@ttab/elephant-ui/icons'
import { useSections } from '@/hooks/useSections'
import type { StatusSpecification } from '@/defaults/workflowSpecification'
import { AvatarGroup } from '@/components/AvatarGroup'
import { Popover, PopoverContent, PopoverTrigger, Tooltip } from '@ttab/elephant-ui'
import { AuthorNames } from './AuthorNames'
import { SubtitleCard } from './SubtitleCard'
import { TimeCard } from './TimeCard'
import type { TrackedDocument } from '@/hooks/useTrackedDocuments'
import { getNewsvalue, getSection } from '@/lib/documentHelpers'

export const ApprovalsCard = ({ trackedDocument, item, isSelected, isFocused, status, openEditors }: {
  item: PreprocessedApprovalData
  status: StatusSpecification
  isSelected: boolean
  isFocused: boolean
  openEditors: string[]
  trackedDocument?: TrackedDocument
}) => {
  const sections = useSections()
  const openArticle = useLink('Editor')
  const openFlash = useLink('Flash')
  const openType = (deliverableType: string) => deliverableType === 'core/flash' ? openFlash : openArticle

  const internalInfo = item._deliverable?.document?.meta.find((block) => block.type === 'core/note' && block.role === 'internal')?.data?.text
  const newsvalue = getNewsvalue(item._deliverable?.document)
  const section = getSection(item._deliverable?.document)
  const deliverableId = item._deliverable?.id
  const deliverableType = item._deliverable?.type

  return (
    <Card.Root
      status={item._deliverable?.status || 'draft'}
      isFocused={isFocused}
      isSelected={isSelected}
      onSelect={(event) => {
        const openDocument = openType(deliverableType || '')

        if (event instanceof KeyboardEvent && event.key == ' ' && deliverableId) {
          openDocument(event, { id: deliverableId, autoFocus: false, preview: true }, openEditors.length > 0 ? undefined : 'last', undefined, true)
        } else if (deliverableId) {
          if (item._deliverable?.status === 'usable') {
            const lastUsableVersion = item._deliverable?.meta?.heads.usable?.version
            openDocument(event, { id: deliverableId, preview: false }, 'last', undefined, undefined, { version: lastUsableVersion as bigint })
          } else {
            openDocument(event, { id: deliverableId })
          }
        }
      }}
    >
      <Card.Header>
        <div className='flex flex-row gap-2 items-center'>
          {status.icon && <status.icon size={15} strokeWidth={1.75} className={status.className} />}
          <span className='bg-secondary inline-block px-1 rounded'>
            {deliverableType === 'core/flash'
              ? <ZapIcon strokeWidth={1.75} size={14} className='text-red-500' />
              : deliverableType === 'core/editorial-info'
                ? <FileWarningIcon size={14} />
                : newsvalue}
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
        <TimeCard item={item} />
      </Card.Header>

      <Card.Content>
        <Card.Title>
          <div className='truncate'>{item._deliverable?.document?.title}</div>
          <SubtitleCard item={item} />
        </Card.Title>
      </Card.Content>

      <Card.Footer>
        <div className='flex flex-col w-full'>
          <div className='truncate'>
            <AuthorNames item={item} />
          </div>
          <div className='flex grow justify-between align-middle'>
            <div className='flex flex-row content-center opacity-60 gap-1'>
              {sections
                .find((s) => s.id === section)
                ?.title}

              {item._preprocessed.metrics?.charCount !== undefined && (
                <span>
                  <span className='pr-1'>
                    &middot;
                  </span>
                  {item._preprocessed.metrics?.charCount || '0' }
                  {' '}
                  tkn
                </span>
              )}
            </div>

            <div className='flex flex-row gap-3'>
              <Link
                to={deliverableType === 'core/flash' ? 'Flash' : 'Editor'}
                props={{ id: deliverableId, autoFocus: false, preview: true }}
                className='block p-1 -m-1 rounded transition-all opacity-70 md:opacity-0 md:group-hover:opacity-70 md:group-focus:opacity-70 md:group-focus-within:opacity-70 hover:bg-gray-300 dark:hover:bg-table-focused'
                keepFocus
                onClick={(e) => e.stopPropagation()}
              >
                <Tooltip content='Öppna förhandsgranskning'>
                  <EyeIcon size={16} strokeWidth={1.75} />
                </Tooltip>
              </Link>
              <Link
                to='Planning'
                props={{ id: item._preprocessed.planningId }}
                className='block p-1 -m-1 rounded transition-all opacity-70 md:opacity-0 md:group-hover:opacity-70 md:group-focus:opacity-70 md:group-focus-within:opacity-70 hover:bg-gray-300 dark:hover:bg-table-focused'
                onClick={(e) => e.stopPropagation()}
              >
                <Tooltip content='Öppna planering'>
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
