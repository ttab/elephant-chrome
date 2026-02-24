import type * as Y from 'yjs'
import { type ViewMetadata, type ViewProps } from '@/types/index'
import { useYDocument, useYValue } from '@/modules/yjs/hooks'
import type { EleDocumentResponse } from '@/shared/types'
import {
  useQuery
} from '@/hooks'
import { useSession } from 'next-auth/react'
import { View } from '@/components/View'
import { Button } from '@ttab/elephant-ui'
import { TagsIcon, CalendarClockIcon, TextIcon, KeyIcon, CalendarPlus2Icon } from '@ttab/elephant-ui/icons'
import {
  Newsvalue,
  Section,
  Story,
  Category,
  Organiser,
  UserMessage
} from '@/components'
import { PlanningTable } from './components/PlanningTable'
import { Error } from '../Error'
import { Form } from '@/components/Form'
import { EventTimeMenu } from './components/EventTime'
import { useMemo, type JSX } from 'react'
import { EventHeader } from './EventHeader'
import { DuplicatesTable } from '../../components/DuplicatesTable'
import { Cancel } from './components/Cancel'
import { CopyGroup } from '../../components/CopyGroup'
import { snapshotDocument } from '@/lib/snapshotDocument'
import { toast } from 'sonner'
import { TextInput } from '@/components/ui/TextInput'
import { getTemplateFromView } from '@/shared/templates/lib/getTemplateFromView'
import { toGroupedNewsDoc } from '@/shared/transformations/groupedNewsDoc'
import { TextBox } from '@/components/ui'
import type { Document } from '@ttab/elephant-api/newsdoc'
import { ToastAction } from '@/components/ToastAction'
import { useTranslation } from 'react-i18next'

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

export const Event = (props: ViewProps & { document?: Document }): JSX.Element => {
  const [query] = useQuery()
  const documentId = props.id || query.id
  const { t } = useTranslation()

  // Event should be responsible for creating new as well as editing
  const data = useMemo(() => {
    if (!props.document || !documentId || typeof documentId !== 'string') {
      return undefined
    }

    return toGroupedNewsDoc({
      version: 0n,
      isMetaDocument: false,
      mainDocument: '',
      document: props.document || getTemplateFromView('Event')(documentId)
    })
  }, [documentId, props.document])

  if (typeof documentId !== 'string' || !documentId) {
    return (
      <Error
        title={t('errors:messages.documentTypeMissing', { documentType: t('event:eventDocument') })}
        message={t('errors:messages.documentTypeMissingDescription', { documentType: t('event:eventDocument') })}
      />
    )
  }

  return (
    <EventViewContent
      {...props}
      documentId={documentId}
      data={data}
    />
  )
}

const EventViewContent = (props: ViewProps & {
  documentId: string
  data?: EleDocumentResponse
  // setNewItem?: Setter
}): JSX.Element | undefined => {
  const ydoc = useYDocument<Y.Map<unknown>>(props.documentId, { data: props.data })
  const { provider, ele: document, connected } = ydoc
  const { t } = useTranslation()

  const { data, status } = useSession()
  const [title] = useYValue<Y.XmlText>(document, 'root.title', true)
  const [registration] = useYValue<Y.XmlText>(document, 'meta.core/event[0].data.registration', true)
  const [publicDescription] = useYValue<Y.XmlText>(document, ['meta', 'core/description', 0, 'data', 'text'], true)
  const [copyGroupId] = useYValue<string | undefined>(document, 'meta.core/copy-group[0].uuid')
  const [cancelled, setCancelled] = useYValue<string | undefined>(document, 'meta.core/event[0].data.cancelled')

  const handleSubmit = async ({ documentStatus }: {
    documentStatus: 'usable' | 'done' | undefined
  }): Promise<void> => {
    if (provider && status === 'authenticated') {
      try {
        await snapshotDocument(props.documentId, {
          status: documentStatus,
          addToHistory: true
        }, provider.document)

        if (props?.onDialogClose) {
          props.onDialogClose()
        }

        toast.success(t('event:toasts.created.success'), {
          classNames: {
            title: 'whitespace-nowrap'
          },
          action: (
            <ToastAction
              key='open-event'
              documentId={props.documentId}
              withView='Event'
              label={t('common:actions.openType', { type: t('event:title') })}
              Icon={CalendarPlus2Icon}
              target='last'
            />
          )
        })
      } catch (ex) {
        console.error('Failed to snapshot event', ex)
        toast.error(t('errors:toasts.couldNotCreateNewEvent'), {
          duration: 5000,
          position: 'top-center'
        })

        // re-throw to allow further handling in Submit
        throw ex
      }
    }
  }

  const environmentIsSane = connected && status === 'authenticated'

  return (
    <View.Root asDialog={props.asDialog} className={props.className}>
      <EventHeader
        ydoc={ydoc}
        asDialog={!!props.asDialog}
        onDialogClose={props.onDialogClose}
        title={title?.toJSON()}
        session={data}
        provider={provider}
        status={status}
      />
      <View.Content className='max-w-[1000px] flex-auto'>
        <Form.Root asDialog={props.asDialog}>
          <Form.Content>
            <Form.Title>
              <TextInput
                ydoc={ydoc}
                value={title}
                label={t('core:labels.title')}
                autoFocus={!!props.asDialog}
                placeholder={t('event:placeholders.eventTitle')}
              />
            </Form.Title>
            <TextBox
              ydoc={ydoc}
              value={publicDescription}
              icon={<TextIcon size={18} strokeWidth={1.75} className='text-muted-foreground mr-4' />}
              placeholder={t('event:placeholders.publicDescription')}
            />
            <TextBox
              ydoc={ydoc}
              value={registration}
              icon={<KeyIcon size={18} strokeWidth={1.75} className='text-muted-foreground mr-4' />}
              placeholder={t('event:placeholders.accreditation')}
            />
            <Form.Group icon={CalendarClockIcon}>
              <EventTimeMenu ydoc={ydoc} />
              <Newsvalue ydoc={ydoc} path='meta.core/newsvalue[0].value' />
            </Form.Group>

            <Form.Group icon={TagsIcon}>
              <Section ydoc={ydoc} path='links.core/section[0]' />
              <Organiser ydoc={ydoc} path='links.core/organiser[0]' />
            </Form.Group>

            <Form.Group icon={TagsIcon}>
              <Category ydoc={ydoc} path='links.core/category' />
              <Story ydoc={ydoc} path='links.core/story[0]' />
            </Form.Group>
            {!props.asDialog && (
              <Cancel cancelled={cancelled} setCancelled={setCancelled} />
            )}

          </Form.Content>

          <Form.Table>
            <PlanningTable ydoc={ydoc} asDialog={props.asDialog} />
            {!props.asDialog && <DuplicatesTable documentId={props.documentId} type='core/event' />}
            {copyGroupId && !props.asDialog && <CopyGroup copyGroupId={copyGroupId} type='core/event' />}
          </Form.Table>

          <Form.Footer>
            {!environmentIsSane && (
              <UserMessage asDialog={!!props.asDialog} className='pb-6'>
                {t('errors:messages.unwellEnvironment')}
              </UserMessage>
            )}

            <Form.Submit
              onSubmit={() => { void handleSubmit({ documentStatus: 'usable' }) }}
              onSecondarySubmit={() => { void handleSubmit({ documentStatus: 'done' }) }}
              onTertiarySubmit={() => { void handleSubmit({ documentStatus: undefined }) }}
              disableOnSubmit
            >
              <div className='flex justify-between'>
                <div className='flex gap-2'>
                  <Button type='button' variant='secondary' role='tertiary' disabled={!environmentIsSane}>
                    {t('core:status.draft')}
                  </Button>
                  <Button type='button' variant='secondary' role='secondary' disabled={!environmentIsSane}>
                    {t('core:status.internal')}
                  </Button>
                </div>
                <Button type='submit' disabled={!environmentIsSane}>
                  {t('common:actions.publish')}
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
