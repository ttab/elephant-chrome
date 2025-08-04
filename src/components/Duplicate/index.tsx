import { Button, Calendar, Popover, PopoverContent, PopoverTrigger } from '@ttab/elephant-ui'
import { DuplicatePrompt } from './DuplicatePrompt'
import { addDays, format } from 'date-fns'
import { createStateless, StatelessType } from '@/shared/stateless'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import type { Session } from 'next-auth'
import { CopyPlus } from '@ttab/elephant-ui/icons'
import { ToastAction } from '@/views/Flash/ToastAction'
import { useYValue } from '@/hooks/useYValue'
import type { EventData } from '@/views/Event/components/EventTime'
import { type SetStateAction, type Dispatch } from 'react'
import { useRegistry } from '@/hooks/useRegistry'

type allowedTypes = 'Event'

const SingleOrRangedCalendar = ({
  granularity,
  duplicateDate,
  setDuplicateDate
}: {
  granularity: 'date' | 'datetime' | undefined
  duplicateDate: { from: Date, to?: Date | undefined }
  setDuplicateDate: Dispatch<SetStateAction<{ from: Date, to?: Date | undefined }>>
}) => {
  if (!granularity) {
    return <></>
  }

  if (granularity === 'date' && duplicateDate?.from) {
    return (
      <Calendar
        mode='range'
        selected={duplicateDate}
        startMonth={new Date(duplicateDate?.from)}
        onSelect={(selectedDate) => {
          if (!selectedDate?.from || !selectedDate?.to) {
            return
          }

          setDuplicateDate({
            from: new Date(format(selectedDate.from, 'yyyy-MM-dd')),
            to: new Date(format(selectedDate?.to, 'yyyy-MM-dd'))
          })
        }}
      />
    )
  }

  return (
    <Calendar
      mode='single'
      selected={duplicateDate?.from}
      startMonth={new Date(duplicateDate?.from)}
      onSelect={(selectedDate) => {
        if (!selectedDate) {
          return
        }

        setDuplicateDate({ from: new Date(format(selectedDate, 'yyyy-MM-dd')), to: undefined })
      }}
    />
  )
}

export const Duplicate = ({ provider, title, session, status, type }: {
  provider: HocuspocusProvider
  title: string | undefined
  session: Session | null
  status: 'authenticated' | 'loading' | 'unauthenticated'
  type: 'event'
}) => {
  const [eventData] = useYValue<EventData>('meta.core/event[0].data')
  const granularity = eventData?.dateGranularity
  const [duplicateDate, setDuplicateDate] = useState<{ from: Date, to?: Date | undefined }>({ from: new Date(), to: new Date() })
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const { locale } = useRegistry()

  useEffect(() => {
    const dates = granularity === 'date'
      ? { from: addDays(eventData?.start ? new Date(eventData?.start) : new Date(), 1), to: addDays(eventData?.end ? new Date(eventData?.end) : new Date(), 1) }
      : { from: addDays(eventData?.start ? new Date(eventData?.start) : new Date(), 1), to: eventData?.end ? addDays(new Date(eventData?.end), 1) : undefined }
    if (eventData?.start) {
      setDuplicateDate(dates)
    }
  }, [eventData?.start, eventData?.end, granularity])

  const createTexts = (granularity: 'date' | 'datetime' | undefined): { description: string, success: string } => {
    if (!granularity) {
      return { description: '', success: '' }
    }
    const start = format(duplicateDate.from, 'EEEE yyyy-MM-dd', { locale: locale.module })

    if (granularity === 'date' && duplicateDate?.to) {
      const end = format(duplicateDate?.to, 'EEEE yyyy-MM-dd', { locale: locale.module })
      const datesFormatted = `${start === end ? `${start}` : `${start} - ${end}`}`

      return {
        description: `Vill du kopiera ${type === 'event' ? 'händelsen' : ''} till ${datesFormatted}?`,
        success: `Händelsen "${title}" har kopierats till ${datesFormatted}`
      }
    }

    if (granularity === 'datetime') {
      return {
        description: `Vill du kopiera ${type === 'event' ? 'händelsen' : ''} till ${start}?`,
        success: `Händelsen "${title}" har kopierats till ${start}`
      }
    }
    return { description: '', success: '' }
  }

  return (
    <div className='flex-row gap-2 justify-start items-center'>
      <Popover>
        <PopoverTrigger title='Kopiera'>
          <div
            className='flex items-center justify-center w-9 h-9 px-0 hover:bg-gray-200 dark:hover:bg-gray-700'
          >
            <CopyPlus size={20} strokeWidth={1.75} />
          </div>
        </PopoverTrigger>
        <PopoverContent onEscapeKeyDown={(event) => event?.stopPropagation()}>
          <SingleOrRangedCalendar granularity={granularity} duplicateDate={duplicateDate} setDuplicateDate={setDuplicateDate} />
          <div className='flex w-full justify-end'>
            <Button onClick={() => setShowConfirm(!showConfirm)}>
              Kopiera
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {showConfirm && (
        <DuplicatePrompt
          duplicateDate={duplicateDate}
          provider={provider}
          title={title || ''}
          type={type}
          description={createTexts(granularity).description}
          secondaryLabel='Avbryt'
          primaryLabel='Kopiera'
          onPrimary={(duplicateId: string | undefined) => {
            const capitalized: allowedTypes = type.slice(0, 1).toUpperCase().concat(type.slice(1)) as allowedTypes
            if (provider && status === 'authenticated' && duplicateId && session) {
              try {
                provider.sendStateless(
                  createStateless(StatelessType.IN_PROGRESS, {
                    state: false,
                    id: duplicateId,
                    context: {
                      agent: 'server',
                      accessToken: session.accessToken,
                      user: session.user,
                      type: capitalized
                    }
                  })
                )
                toast.success(createTexts(granularity).success, {
                  action: <ToastAction eventId={duplicateId} />
                })
              } catch (error) {
                toast.error(`Något gick fel: ${JSON.stringify(error)}`)
                console.error(error)
              }
            }
            setShowConfirm(false)
          }}
          onSecondary={() => {
            setShowConfirm(false)
          }}
        />
      )}
    </div>
  )
}
