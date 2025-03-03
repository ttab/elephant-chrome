import { Button, Calendar, Popover, PopoverContent, PopoverTrigger } from '@ttab/elephant-ui'
import { DuplicatePrompt } from './DuplicatePrompt'
import { addDays, format } from 'date-fns'
import { createStateless, StatelessType } from '@/shared/stateless'
import { useState } from 'react'
import { toast } from 'sonner'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import type { Session } from 'next-auth'

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
      <Popover modal={true}>
        <PopoverTrigger asChild>
          <div className='flex w-fit px-10 pt-2'>
            <Button variant='outline' size='xs'>Kopiera</Button>
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
              setDuplicateDate(selectedDate)
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
          description={`Vill du kopiera ${type === 'event' ? 'händelsen' : ''} till ${format(duplicateDate, 'dd/MM/yyyy')}?`}
          secondaryLabel='Avbryt'
          primaryLabel='Kopiera'
          onPrimary={(duplicateId: string | undefined) => {
            console.log('provider', provider)
            if (provider && status === 'authenticated' && duplicateId && session) {
              try {
                console.log('sending', duplicateId)
                provider.sendStateless(
                  createStateless(StatelessType.IN_PROGRESS, {
                    state: false,
                    id: duplicateId,
                    context: {
                      accessToken: session.accessToken,
                      user: session.user,
                      type: type.slice(0, 1).toUpperCase().concat(type.slice(1))
                    }
                  })
                )
                toast.success('Kopieringen lyckades!')
              } catch (error) {
                toast.error(`Något gick fel: ${JSON.stringify(error)}`)
                console.log(error)
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
