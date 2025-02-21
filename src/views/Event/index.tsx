import type * as Y from 'yjs'
import { type ViewMetadata, type ViewProps } from '@/types/index'
import { AwarenessDocument } from '@/components/AwarenessDocument'
import {
  useCollaboration,
  useQuery,
  useDocumentStatus
} from '@/hooks'
import { useSession } from 'next-auth/react'
import { View, ViewHeader } from '@/components/View'
import { createStateless, StatelessType } from '@/shared/stateless'
import { Button } from '@ttab/elephant-ui'
import { Tags, CalendarClock, CalendarPlus2 } from '@ttab/elephant-ui/icons'
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
  const [query] = useQuery()
  const documentId = props.id || query.id

  if (!documentId) {
    return <></>
  }

  return (
    <>
      {typeof documentId === 'string'
        ? (
            <AwarenessDocument documentId={documentId} document={props.document}>
              <EventViewContent {...props} documentId={documentId} document={props.document} />
            </AwarenessDocument>
          )
        : (
            <Error
              title='Händelsedokument saknas'
              message='Inget händelsedokument är angivet. Navigera tillbaka till översikten och försök igen'
            />
          )}
    </>
  )
}

const EventViewContent = (props: ViewProps & { documentId: string, document: Y.Doc | undefined }): JSX.Element | undefined => {
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

  return (
    <View.Root asDialog={props.asDialog} className={props.className}>
      <div className='grow-0'>
        <ViewHeader.Root asDialog={props.asDialog}>
          {!props.asDialog
            ? <ViewHeader.Title title='Händelse' icon={CalendarPlus2} iconColor='#DAC9F2' />
            : <ViewHeader.Title title='Skapa ny händelse' icon={CalendarPlus2} iconColor='#DAC9F2' asDialog />}

          <ViewHeader.Content>
            <div className='flex w-full h-full items-center space-x-2'>
              {!props.asDialog && <DocumentStatus status={documentStatus} setStatus={setDocumentStatus} />}
            </div>
          </ViewHeader.Content>

          <ViewHeader.Action onDialogClose={props.onDialogClose}>
            {!props.asDialog && !!props.documentId
            && <ViewHeader.RemoteUsers documentId={props.documentId} />}
          </ViewHeader.Action>
        </ViewHeader.Root>
      </div>

      <View.Content className='max-w-[1000px]'>
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

            <Form.Group icon={CalendarClock}>
              <EventTimeMenu />
              <Newsvalue />
            </Form.Group>

            <Form.Group icon={Tags}>
              <Section />
              <Organiser />
            </Form.Group>

            <Form.Group icon={Tags}>
              <Category asDialog={props.asDialog} />
              <Story />
            </Form.Group>

          </Form.Content>

          <Form.Table>
            <PlanningTable provider={provider} asDialog={props.asDialog} documentId={props.documentId} />
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
      </View.Content>
    </View.Root>
  )
}

Event.meta = meta
