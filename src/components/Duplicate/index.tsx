import { Button, Calendar, Popover, PopoverContent, PopoverTrigger } from '@ttab/elephant-ui'
import { DuplicatePrompt } from './DuplicatePrompt'
import { addDays, format } from 'date-fns'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import type { Session } from 'next-auth'
import { CopyPlusIcon } from '@ttab/elephant-ui/icons'
import { ToastAction } from '@/views/Flash/ToastAction'
import type { EventData } from '@/views/Event/components/EventTime'
import type { PlanningData } from '@/types/index'
import { type SetStateAction, type Dispatch } from 'react'
import { useRegistry } from '@/hooks/useRegistry'
import { isEvent, isPlanning } from './isType'
import type { Document } from '@ttab/elephant-api/newsdoc'

const SingleOrRangedCalendar = ({
  granularity,
  duplicateDate,
  setDuplicateDate,
  dataInfo
}: {
  granularity: 'date' | 'datetime' | undefined
  duplicateDate: { from: Date, to?: Date | undefined }
  setDuplicateDate: Dispatch<SetStateAction<{ from: Date, to?: Date | undefined }>>
  dataInfo: EventData | PlanningData
}) => {
  const { locale } = useRegistry()

  if (isEvent(dataInfo)) {
    if (!granularity) {
      return <></>
    }

    if (granularity === 'date' && duplicateDate?.from) {
      return (
        <Calendar
          mode='range'
          locale={locale.module}
          selected={duplicateDate}
          startMonth={new Date(duplicateDate?.from)}
          onSelect={(selectedDate) => {
            if (!selectedDate?.from || !selectedDate?.to) {
              return
            }

            setDuplicateDate({
              from: new Date(selectedDate.from),
              to: new Date(selectedDate?.to)
            })
          }}
        />
      )
    }
  }


  return (
    <Calendar
      mode='single'
      locale={locale.module}
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

export const Duplicate = ({ provider, title, session, status, type, dataInfo }: {
  provider: HocuspocusProvider
  title: string | undefined
  session: Session | null
  status: 'authenticated' | 'loading' | 'unauthenticated'
  type: 'Event' | 'Planning'
  dataInfo: EventData | PlanningData
}) => {
  const granularity = isEvent(dataInfo) ? dataInfo?.dateGranularity : undefined
  const [duplicateDate, setDuplicateDate] = useState<{ from: Date, to?: Date | undefined }>({ from: new Date(), to: new Date() })
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const { locale, repository } = useRegistry()

  useEffect(() => {
    if (isEvent(dataInfo)) {
      const dates = granularity === 'date'
        ? { from: dataInfo?.start ? new Date(dataInfo?.start) : new Date(), to: dataInfo?.end ? new Date(dataInfo?.end) : new Date() }
        : { from: dataInfo?.start ? new Date(dataInfo?.start) : new Date(), to: dataInfo?.end ? new Date(dataInfo?.end) : undefined }

      setDuplicateDate(dates)
    }

    if (isPlanning(dataInfo)) {
      const dates = {
        from: addDays(new Date(dataInfo.start_date), 1),
        to: addDays(new Date(dataInfo.end_date), 1)
      }
      setDuplicateDate(dates)
    }
  }, [dataInfo, granularity])

  if (!dataInfo) {
    return <></>
  }

  const createTexts = (granularity: 'date' | 'datetime' | undefined): { description: string, success: string } => {
    const start = format(duplicateDate.from, 'EEEE yyyy-MM-dd', { locale: locale.module })
    const defaultTexts = {
      description: `Vill du kopiera "${title}" till ${start}?`,
      success: `"${title}" har kopierats till ${start}`
    }

    if (isEvent(dataInfo)) {
      if (!granularity) {
        return { description: '', success: '' }
      }

      if (granularity === 'date' && duplicateDate?.to) {
        const end = format(duplicateDate?.to, 'EEEE yyyy-MM-dd', { locale: locale.module })
        const datesFormatted = `${start === end ? `${start}` : `${start} - ${end}`}`

        return {
          description: `Vill du kopiera händelsen till ${datesFormatted}?`,
          success: `Händelsen "${title}" har kopierats till ${datesFormatted}`
        }
      }

      if (granularity === 'datetime') {
        return defaultTexts
      }
    }

    return defaultTexts
  }

  return (
    <div className='flex-row gap-2 justify-start items-center'>
      <Popover>
        <PopoverTrigger title='Kopiera'>
          <div
            className='flex items-center justify-center w-9 h-9 px-0 hover:bg-gray-200 dark:hover:bg-gray-700'
          >
            <CopyPlusIcon size={20} strokeWidth={1.75} />
          </div>
        </PopoverTrigger>
        <PopoverContent onEscapeKeyDown={(event) => event?.stopPropagation()}>
          <SingleOrRangedCalendar
            dataInfo={dataInfo}
            granularity={granularity}
            duplicateDate={duplicateDate}
            setDuplicateDate={setDuplicateDate}
          />
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
          type={type}
          description={createTexts(granularity).description}
          secondaryLabel='Avbryt'
          primaryLabel='Kopiera'
          onPrimary={(duplicateId: string | undefined, duplicatedDocument: Document) => {
            if (provider && status === 'authenticated' && duplicateId && session && repository) {
              try {
                void (async () => {
                  await repository.saveDocument(duplicatedDocument, session.accessToken).catch((err) => console.error(err))
                })()

                toast.success(createTexts(granularity).success, {
                  action: <ToastAction planningId={type === 'Planning' ? duplicateId : undefined} eventId={type === 'Event' ? duplicateId : undefined} />
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
