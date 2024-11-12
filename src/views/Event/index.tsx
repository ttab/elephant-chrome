import type * as Y from 'yjs'
import { type ViewMetadata, type ViewProps } from '@/types/index'
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
import { ScrollArea, Button } from '@ttab/elephant-ui'
import { Tags, Ticket, Calendar } from '@ttab/elephant-ui/icons'
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
import { Error } from '../Error'
import { Form } from '@/components/Form'
// import { EventTimeMenu } from './components/EventTime'
import { EventTimeMenu } from './components/EventTime'

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
        : <Error
            title='Händelsedokument saknas'
            message='Inget händelsedokument är angivet. Navigera tillbaka till översikten och försök igen'
        />
      }
    </>
  )
}

const EventViewContent = (props: ViewProps & { documentId: string }): JSX.Element | undefined => {
  const { provider } = useCollaboration()
  const { data, status } = useSession()
  const [documentStatus, setDocumentStatus] = useDocumentStatus(props.documentId)

  const handleSubmit = (): void => {
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


  const [eventTitle] = useYValue<string | undefined>('root.title')

  const viewVariants = cva('flex flex-col', {
    variants: {
      asCreateDialog: {
        false: 'h-screen',
        true: 'overflow-hidden'
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
        <Form.Root asDialog={props.asDialog}>
          <Form.Content>
            <Form.Title>
              <Title
                autoFocus={props.asDialog}
                placeholder='Händelserubrik'
              />

            </Form.Title>
            <Description role='public' />
            <Registration />

            <Form.Group icon={Calendar}>
              <EventTimeMenu />
            </Form.Group>

            <Form.Group icon={Tags}>
              <Section />
              <Organiser />
            </Form.Group>

            <Form.Group icon={Tags}>
              <Category />
              <Story />
            </Form.Group>

          </Form.Content>

          <Form.Table>
            <PlanningTable eventId={props.documentId} eventTitle={eventTitle} />
          </Form.Table>

          <Form.Footer>
            <Form.Submit onSubmit={handleSubmit}>

              <div className='flex justify-end px-6 py-4'>
                <Button type='submit'>
                  Skapa händelse
                </Button>
              </div>
            </Form.Submit>
          </Form.Footer>
        </Form.Root>
      </ScrollArea>
    </div >
  )
}

Event.meta = meta
