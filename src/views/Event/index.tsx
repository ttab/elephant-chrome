import type * as Y from 'yjs'
import { type ValidateState, type ViewMetadata, type ViewProps } from '@/types/index'
import { AwarenessDocument } from '@/components/AwarenessDocument'
import {
  useCollaboration,
  useQuery,
  useYValue,
  useDocumentStatus
} from '@/hooks'
import { useSession } from 'next-auth/react'
import { ViewHeader } from '@/components/View'
import { createStateless, StatelessType } from '@/shared/stateless'
import { ScrollArea, Separator, Button } from '@ttab/elephant-ui'
import { Ticket } from '@ttab/elephant-ui/icons'
import { cn } from '@ttab/elephant-ui/utils'
import { cva } from 'class-variance-authority'
import {
  Description,
  DocumentStatus,
  Newsvalue,
  Title,
  Section,
  Story,
  Registration,
  Category,
  Organiser
} from '@/components'
import { PlanningTable } from './components/PlanningTable'
import { useState, useRef } from 'react'
import { ValidationAlert } from '@/components/ValidationAlert'

const meta: ViewMetadata = {
  name: 'Event',
  path: `${import.meta.env.BASE_URL || ''}/event`,
  widths: {
    sm: 12,
    md: 12,
    lg: 6,
    xl: 6,
    '2xl': 6,
    hd: 6,
    fhd: 4,
    qhd: 3,
    uhd: 2
  }
}

export const Event = (props: ViewProps & { document?: Y.Doc }): JSX.Element => {
  const query = useQuery()
  const documentId = props.id || query.id


  return (
    <>
      {documentId
        ? <AwarenessDocument documentId={documentId} document={props.document}>
          <EventViewContent {...props} documentId={documentId} />
        </AwarenessDocument>
        : <></>
      }
    </>
  )
}

const EventViewContent = (props: ViewProps & { documentId: string }): JSX.Element | undefined => {
  const { provider } = useCollaboration()
  const { data, status } = useSession()
  const [documentStatus, setDocumentStatus] = useDocumentStatus(props.documentId)
  const [validateForm, setValidateForm] = useState<boolean>(!props.asDialog)
  const validateStateRef = useRef<ValidateState>({})

  const handleValidation = (block: string, label: string, value: string | undefined, reason: string): boolean => {
    validateStateRef.current = {
      ...validateStateRef.current,
      [block]: { label, valid: !!value, reason }
    }

    if (validateForm) {
      return !!value
    }

    return true
  }


  const [eventTitle] = useYValue<string | undefined>('root.title')

  const viewVariants = cva('flex flex-col', {
    variants: {
      asCreateDialog: {
        false: 'h-screen',
        true: 'overflow-hidden'
      }
    }
  })

  const sectionVariants = cva('overscroll-auto @5xl:w-[1024px] space-y-5', {
    variants: {
      asCreateDialog: {
        false: 'p-8',
        true: 'p-6'
      }
    }
  })

  return (
    <div className={cn(viewVariants({ asCreateDialog: !!props.asDialog, className: props?.className }))}>
      <div className='grow-0'>
        <ViewHeader.Root>
          {!props.asDialog &&
            <ViewHeader.Title title='Händelse' icon={Ticket} iconColor='#DAC9F2' />
          }

          <ViewHeader.Content>
            <div className='flex w-full h-full items-center space-x-2'>
              <DocumentStatus status={documentStatus} setStatus={setDocumentStatus} />
              <Newsvalue />
            </div>
          </ViewHeader.Content>

          <ViewHeader.Action onDialogClose={props.onDialogClose}>
            {!props.asDialog && !!props.documentId &&
              <ViewHeader.RemoteUsers documentId={props.documentId} />
            }
          </ViewHeader.Action>
        </ViewHeader.Root>
      </div>

      <ScrollArea className='grid @5xl:place-content-center'>
        <section className={cn(sectionVariants({ asCreateDialog: !!props?.asDialog }))}>
          <ValidationAlert validateStateRef={validateStateRef} />
          <div className='flex flex-col gap-2 pl-0.5'>
            <div className='flex space-x-2 items-start'>
              <Title
                autoFocus={props.asDialog}
                placeholder='Händelserubrik'
                onValidation={handleValidation}
              />
            </div>

            <Description role='public' />
            <Registration />

            <p>Datetime TODO</p>
          </div>

          <div className='flex flex-col space-y-2 w-fit'>
            <div className='flex flex-wrap gap-2'>
              <Organiser />
              <Section onValidation={handleValidation} />
              <Category />
              <Story />
            </div>

            <PlanningTable eventId={props.documentId} eventTitle={eventTitle} />
          </div>

        </section>

        {props.asDialog && (
          <div>
            <Separator className='ml-0' />
            <div className='flex justify-end px-6 py-4'>
              <Button onClick={() => {
                setValidateForm(true)
                // if all fields are valid close and save
                if (Object.values(validateStateRef.current).every((state) => !!state)) {
                  // Get the id, post it, and open it in a view?
                  if (props?.onDialogClose) {
                    props.onDialogClose()
                  }

                  if (provider && status === 'authenticated') {
                    provider.sendStateless(
                      createStateless(StatelessType.IN_PROGRESS, {
                        state: false,
                        id: props.documentId,
                        context: {
                          accessToken: data.accessToken,
                          user: data.user,
                          type: 'Event'
                        }
                      }))
                  }
                }
              }}>
                Skapa händelse
              </Button>
            </div>
          </div>)}

      </ScrollArea>
    </div >
  )
}

Event.meta = meta
