import type * as Y from 'yjs'
import { type ViewMetadata, type ViewProps } from '@/types/index'
import { AwarenessDocument } from '@/components/AwarenessDocument'
import {
  useCollaboration,
  useQuery,
  useAwareness,
  useYValue
} from '@/hooks'
import { useSession } from 'next-auth/react'
import { View } from '@/components/View'
import { createStateless, StatelessType } from '@/shared/stateless'
import { Button } from '@ttab/elephant-ui'
import { Tags, CalendarClock } from '@ttab/elephant-ui/icons'
import {
  Description,
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
import { useEffect } from 'react'
import { EventHeader } from './EventHeader'
import { DuplicatesTable } from './components/DuplicatesTable'
import { Cancel } from './components/Cancel'

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
              <EventViewContent {...props} documentId={documentId} />
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

const EventViewContent = (props: ViewProps & { documentId: string }): JSX.Element | undefined => {
  const { provider, user } = useCollaboration()
  const { data, status } = useSession()
  const [, setIsFocused] = useAwareness(props.documentId)
  const [eventTitle] = useYValue<string | undefined>('root.title')
  const [cancelled, setCancelled] = useYValue<string | undefined>('meta.core/event[0].data.cancelled')

  useEffect(() => {
    provider?.setAwarenessField('data', user)
    setIsFocused(true)

    return () => {
      setIsFocused(false)
    }

    // We only want to rerun when provider change
    // eslint-disable-next-line
  }, [provider])

  const handleSubmit = ({ documentStatus }: {
    documentStatus: 'usable' | 'done' | undefined
  }): void => {
    if (props?.onDialogClose) {
      props.onDialogClose()
    }

    if (provider && status === 'authenticated') {
      provider.sendStateless(
        createStateless(StatelessType.IN_PROGRESS, {
          state: false,
          status: documentStatus,
          id: props.documentId,
          context: {
            agent: 'server',
            accessToken: data.accessToken,
            user: data.user,
            type: 'Event'
          }
        }))
    }
  }

  return (
    <View.Root asDialog={props.asDialog} className={props.className}>
      <EventHeader
        asDialog={!!props.asDialog}
        onDialogClose={props.onDialogClose}
        documentId={props.documentId}
        title={eventTitle}
        provider={provider}
        session={data}
        type='event'
        status={status}
      />
      <View.Content className='max-w-[1000px] flex-auto'>
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
            {!props.asDialog && (
              <Cancel cancelled={cancelled} setCancelled={setCancelled} />
            )}

          </Form.Content>

          <Form.Table>
            <PlanningTable provider={provider} asDialog={props.asDialog} documentId={props.documentId} />
            <DuplicatesTable documentId={props.documentId} />
          </Form.Table>

          <Form.Footer>
            <Form.Submit
              onSubmit={() => handleSubmit({ documentStatus: 'usable' })}
              onSecondarySubmit={() => handleSubmit({ documentStatus: 'done' })}
              onTertiarySubmit={() => handleSubmit({ documentStatus: undefined })}
            >
              <div className='flex justify-between'>
                <div className='flex gap-2'>
                  <Button type='button' variant='secondary' role='tertiary'>
                    Utkast
                  </Button>
                  <Button type='button' variant='secondary' role='secondary'>
                    Intern
                  </Button>
                </div>
                <Button type='submit'>
                  Publicera
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
