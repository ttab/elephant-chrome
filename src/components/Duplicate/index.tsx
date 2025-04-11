import { Button, Calendar, Popover, PopoverContent, PopoverTrigger } from '@ttab/elephant-ui'
import { DuplicatePrompt } from './DuplicatePrompt'
import { addDays, format } from 'date-fns'
import { createStateless, StatelessType } from '@/shared/stateless'
import { useState } from 'react'
import { toast } from 'sonner'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import type { Session } from 'next-auth'
import { CopyPlus } from '@ttab/elephant-ui/icons'
import { ToastAction } from '@/views/Flash/ToastAction'

type allowedTypes = 'Event'

export const Duplicate = ({ provider, title, session, status, type }: {
  provider: HocuspocusProvider
  title: string | undefined
  session: Session | null
  status: 'authenticated' | 'loading' | 'unauthenticated'
  type: 'event'
}) => {
  const [duplicateDate, setDuplicateDate] = useState<Date>(addDays(new Date(), 1))
  const [showConfirm, setShowConfirm] = useState<boolean>(false)

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
          <Calendar
            mode='single'
            disabled={{ before: addDays(new Date(), 1) }}
            selected={duplicateDate}
            startMonth={new Date(duplicateDate)}
            onSelect={(selectedDate) => {
              if (!selectedDate) {
                return
              }
              setDuplicateDate(new Date(format(selectedDate, 'yyyy-MM-dd')))
            }}
          />
          <div className='flex w-full justify-end'>
            <Button
              onClick={() => setShowConfirm(!showConfirm)}
            >
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
          description={`Vill du kopiera ${type === 'event' ? 'händelsen' : ''} till ${format(duplicateDate, 'dd/MM/yyyy')}?`}
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
                toast.success(`Händelsen "${title}" kopierades till ${format(duplicateDate, 'dd/MM/yyyy')}`, {
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
