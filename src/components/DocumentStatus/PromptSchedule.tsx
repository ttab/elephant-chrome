import type { WorkflowTransition } from '@/defaults/workflowSpecification'
import { Prompt } from '../Prompt'
import { useState } from 'react'
import { Label } from '@ttab/elephant-ui'
import { TimeInput } from '../TimeInput'
import { fromZonedTime, getTimezoneOffset, toZonedTime } from 'date-fns-tz'
import { format } from 'date-fns'
import { CalendarIcon, LoaderIcon, TriangleAlertIcon, type LucideIcon } from '@ttab/elephant-ui/icons'
import { PromptCauseField } from './PromptCauseField'
import { useTranslation } from 'react-i18next'
import { useCollaborationDocument } from '@/hooks/useCollaborationDocument'
import { useRegistry } from '@/hooks/useRegistry'
import type { YDocument } from '@/modules/yjs/hooks'
import { useYValue } from '@/modules/yjs/hooks'
import { HastToggle } from '@/components/HastToggle'
import { DEFAULT_TIMEZONE } from '@/defaults/defaultTimezone'
import type * as Y from 'yjs'

function formatOffsetDiff(diffMinutes: number): string {
  const sign = diffMinutes >= 0 ? '+' : '-'
  const abs = Math.abs(diffMinutes)
  const hours = Math.floor(abs / 60)
  const mins = abs % 60
  return mins === 0 ? `${sign}${hours}h` : `${sign}${hours}h ${mins}m`
}

export const PromptSchedule = ({
  prompt, planningId, setStatus, showPrompt, requireCause = false, anchor, typeIcon,
  embargoUntil, ydoc, usableId, documentType
}: {
  prompt: {
    status: string
  } & WorkflowTransition
  planningId: string
  setStatus: (status: string, data: Record<string, unknown>) => void
  showPrompt: React.Dispatch<React.SetStateAction<({
    status: string
  } & WorkflowTransition) | undefined>>
  requireCause?: boolean
  embargoUntil?: string
  ydoc?: YDocument<Y.Map<unknown>>
  usableId?: bigint
  documentType?: string
  anchor?: HTMLElement | null
  typeIcon?: LucideIcon
}) => {
  const { loading, document } = useCollaborationDocument({ documentId: planningId })
  const { timeZone: userTimeZone } = useRegistry()
  const ele = document ? document.getMap('ele') : undefined
  const [publishDate] = useYValue<Date>(ele, 'meta.core/planning-item[0].data.start_date') as Date[]
  const now = new Date()
  const embargoCandidate = embargoUntil ? new Date(embargoUntil) : undefined
  const activeEmbargo = embargoCandidate && embargoCandidate > now ? embargoCandidate : undefined
  const [time, setTime] = useState<Date | undefined>(activeEmbargo)
  const [cause, setCause] = useState<string | undefined>()
  const { t } = useTranslation()

  const timeViolatesEmbargo = time !== undefined && activeEmbargo ? time < activeEmbargo : false
  const timeInPast = time !== undefined && time < now
  const offsetReference = time ?? now
  const offsetDiffMinutes = Math.round(
    (getTimezoneOffset(userTimeZone, offsetReference)
      - getTimezoneOffset(DEFAULT_TIMEZONE, offsetReference)) / 60_000
  )
  const timeZoneMismatch = offsetDiffMinutes !== 0
  const offsetLabel = formatOffsetDiff(offsetDiffMinutes)

  // Scheduling is bound to the planning's date. When that date has already
  // passed in the system timezone the document cannot be scheduled here; the
  // assignment must be moved to a planning on the intended publish day.
  const todayInTz = format(toZonedTime(now, DEFAULT_TIMEZONE), 'yyyy-MM-dd')
  const planningDateInTz = publishDate
    ? format(toZonedTime(new Date(publishDate), DEFAULT_TIMEZONE), 'yyyy-MM-dd')
    : undefined
  const planningInPast = !!planningDateInTz && planningDateInTz < todayInTz
  const scheduleBase = publishDate ? new Date(publishDate) : now

  const displayDate = time ?? scheduleBase

  return (
    <Prompt
      title={prompt.promptTitle || prompt.title}
      anchor={anchor}
      primaryLabel={prompt.title}
      secondaryLabel={t('common:actions.abort')}
      onPrimary={() => {
        if (!time) return
        showPrompt(undefined)
        void setStatus(
          prompt.status,
          {
            time,
            cause
          }
        )
      }}
      onSecondary={() => {
        showPrompt(undefined)
      }}
      disablePrimary={
        (requireCause && !cause) || !time || timeInPast || timeViolatesEmbargo || planningInPast
      }
      typeIcon={typeIcon}
    >
      <div className='flex flex-col items-start gap-6'>
        {prompt.description}

        {activeEmbargo && (
          <div className='text-sm text-orange-700 dark:text-orange-400'>
            {t('shared:status_menu.embargoMinTime', {
              time: format(toZonedTime(activeEmbargo, DEFAULT_TIMEZONE), 'yyyy-MM-dd HH:mm')
            })}
          </div>
        )}

        {timeZoneMismatch && (
          <div className='text-sm text-orange-700 dark:text-orange-400'>
            {t('shared:status_menu.timezoneMismatch', { offset: offsetLabel })}
          </div>
        )}

        {planningInPast && (
          <div className='text-sm text-red-600 dark:text-red-400'>
            {t('shared:status_menu.planningDateInPast')}
          </div>
        )}

        <div className='flex flex-row justify-items-start items-start gap-6 flex-wrap pt-2'>

          <div className='flex flex-col items-start gap-2 w-28'>
            <Label htmlFor='ScheduledTime'>{t('shared:status_menu.setTime')}</Label>

            <TimeInput
              id='ScheduledTime'
              autoFocus={true}
              disabled={planningInPast}
              defaultTime={time ? format(toZonedTime(time, DEFAULT_TIMEZONE), 'HH:mm') : ''}
              handleOnChange={(value) => {
                if (!value) return
                const [hour, mins] = value.split(':').map(Number)
                // Interpret picker input in DEFAULT_TIMEZONE so the stored instant
                // matches the time labelled in the dialog regardless of browser TZ.
                const baseInTz = toZonedTime(time ?? scheduleBase, DEFAULT_TIMEZONE)
                baseInTz.setHours(hour, mins, 0, 0)
                setTime(fromZonedTime(baseInTz, DEFAULT_TIMEZONE))
              }}
              handleOnSelect={() => { }}
              setOpen={() => { }}
              className='border w-full'
            />
            <div className='relative min-h-5 w-full'>
              {(timeViolatesEmbargo || timeInPast) && (
                <div
                  role='alert'
                  className='absolute top-0 left-0 flex flex-row items-center gap-1 text-sm text-red-600 dark:text-red-400 whitespace-nowrap'
                >
                  <TriangleAlertIcon size={14} strokeWidth={1.75} />
                  {t(
                    timeViolatesEmbargo
                      ? 'shared:status_menu.beforeEmbargo'
                      : 'shared:status_menu.timeInPast'
                  )}
                </div>
              )}
            </div>
          </div>

          <div className='flex flex-col gap-2'>
            <Label htmlFor='ScheduledTime'>{t('shared:status_menu.planningDate')}</Label>
            {loading && planningId
              ? (
                  <LoaderIcon size={14} strokeWidth={1.75} className='animate-spin mx-auto' />
                )
              : (
                  <span className='border py-2 px-3 h-8 text-sm rounded flex flex-row gap-4 items-center justify-between bg-muted'>
                    {format(toZonedTime(displayDate, DEFAULT_TIMEZONE), 'yyyy-MM-dd')}
                    <CalendarIcon size={14} strokeWidth={1.75} />
                  </span>
                )}
          </div>

          {requireCause && (
            <div className='flex flex-col gap-2'>
              <PromptCauseField onValueChange={setCause} />
            </div>
          )}

        </div>

        {time && timeZoneMismatch && (
          <div className='text-sm flex flex-col gap-0.5'>
            <div className='font-medium'>
              {t('shared:status_menu.publishesInDefaultTz', {
                time: format(toZonedTime(time, DEFAULT_TIMEZONE), 'yyyy-MM-dd HH:mm')
              })}
            </div>
            <div className='text-muted-foreground'>
              {t('shared:status_menu.publishesInUserTz', {
                time: format(toZonedTime(time, userTimeZone), 'yyyy-MM-dd HH:mm'),
                tz: userTimeZone
              })}
            </div>
          </div>
        )}

        {ydoc && documentType === 'core/article' && (
          <HastToggle ydoc={ydoc} usableId={usableId} variant='full' className='w-full' />
        )}
      </div>
    </Prompt>
  )
}
