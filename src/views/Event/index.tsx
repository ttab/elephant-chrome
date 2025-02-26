import type * as Y from 'yjs'
import { type ViewMetadata, type ViewProps } from '@/types/index'
import { AwarenessDocument } from '@/components/AwarenessDocument'
import {
  useCollaboration,
  useQuery,
  useYValue,
  useRegistry,
  useAwareness
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
import type { Block } from '@ttab/elephant-api/newsdoc'
import { useEffect, useMemo } from 'react'
import { convertToISOStringInTimeZone } from '@/lib/datetime'
import { EventHeader } from './EventHeader'

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
  const { timeZone } = useRegistry()
  const [, setIsFocused] = useAwareness(props.documentId)

  useEffect(() => {
    provider?.setAwarenessField('data', user)
    setIsFocused(true)

    return () => {
      setIsFocused(false)
    }

    // We only want to rerun when provider change
    // eslint-disable-next-line
  }, [provider])

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

  // Grab values from event to be sent as default values for planning creation
  const [eventTitle] = useYValue<string | undefined>('root.title')
  const [eventSection] = useYValue<Block | undefined>('links.core/section[0]')
  const [newsvalue] = useYValue<Block | undefined>('meta.core/newsvalue[0]')
  const [story] = useYValue<Block | undefined>('links.core/story[0]')
  const [eventDate] = useYValue<string | undefined>('meta.core/event[0].data.start')
  const [description] = useYValue<Block | undefined>('meta.core/description[0].data.text')
  const eventDateFormatted = eventDate ? convertToISOStringInTimeZone(new Date(eventDate), timeZone).split(' ')[0] : undefined

  const templateValues = useMemo(() => ({
    eventId: props.documentId,
    eventTitle,
    eventSection: eventSection?.title,
    newsvalue: newsvalue?.value,
    story: story?.title,
    eventDate: eventDateFormatted,
    description
  }), [props.documentId, eventTitle, eventSection, newsvalue, story, eventDateFormatted, description])

  return (
    <View.Root asDialog={props.asDialog} className={props.className}>
      <EventHeader asDialog={!!props.asDialog} documentId={props.documentId} />

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

          </Form.Content>

          <Form.Table>
            <PlanningTable templateValues={templateValues} asDialog={props.asDialog} />
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
