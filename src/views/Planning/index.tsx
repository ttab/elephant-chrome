import {
  Newsvalue,
  Story,
  Section,
  View,
  UserMessage
} from '@/components'
import { type ViewMetadata, type ViewProps } from '@/types'
import { TagsIcon, CalendarIcon, MessageCircleMoreIcon, TextIcon, CalendarDaysIcon } from '@ttab/elephant-ui/icons'
import {
  useQuery,
  useWorkflowStatus
} from '@/hooks'
import { PlanDate } from './components/PlanDate'
import { AssignmentTable } from './components/AssignmentTable'

import type * as Y from 'yjs'
import { Error } from '../Error'
import { Form } from '@/components/Form'
import { SluglineEditable } from '@/components/DataItem/SluglineEditable'
import { Button } from '@ttab/elephant-ui'
import { useSession } from 'next-auth/react'
import { PlanningHeader } from './components/PlanningHeader'
import React, { type SetStateAction, useMemo, type JSX } from 'react'
import type { NewItem } from '../Event/components/PlanningTable'
import { RelatedEvents } from './components/RelatedEvents'
import type { Block, Document } from '@ttab/elephant-api/newsdoc'
import { CopyGroup } from '../../components/CopyGroup'
import { DuplicatesTable } from '../../components/DuplicatesTable'
import { snapshotDocument } from '@/lib/snapshotDocument'
import { toast } from 'sonner'
import { useYDocument, useYValue } from '@/modules/yjs/hooks'
import { getTemplateFromView } from '@/shared/templates/lib/getTemplateFromView'
import { toGroupedNewsDoc } from '@/shared/transformations/groupedNewsDoc'
import type { EleDocumentResponse } from '@/shared/types'
import { TextBox } from '@/components/ui'
import { useDescriptionIndex } from './hooks/useDescriptionIndex'
import { TextInput } from '@/components/ui/TextInput'
import { ToastAction } from '../Wire/ToastAction'
import { useTranslation } from 'react-i18next'

type Setter = React.Dispatch<SetStateAction<NewItem>>

const meta: ViewMetadata = {
  name: 'Planning',
  path: `${import.meta.env.BASE_URL || ''}/planning`,
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

export const Planning = (props: ViewProps & {
  document?: Document
  setNewItem?: Setter
}): JSX.Element => {
  const [query] = useQuery()
  const documentId = props.id || query.id

  const { t } = useTranslation()

  // Planning should be responsible for creating new as well as editing
  const data = useMemo(() => {
    if (!props.document || !documentId || typeof documentId !== 'string') {
      return undefined
    }

    return toGroupedNewsDoc({
      version: 0n,
      isMetaDocument: false,
      mainDocument: '',
      document: props.document || getTemplateFromView('Planning')(documentId)
    })
  }, [documentId, props.document])

  if (!documentId) {
    return <></>
  }

  return (
    <>
      {typeof documentId === 'string'
        ? (
            <PlanningViewContent
              {...props}
              documentId={documentId}
              setNewItem={props?.setNewItem}
              data={data}
            />
          )
        : (
            <Error
              title={t('planning:prompts.planningDocumentMissing')}
              message={t('planning:prompts.documentMissingMessage')}
            />
          )}
    </>
  )
}

const PlanningViewContent = (props: ViewProps & {
  documentId: string
  data?: EleDocumentResponse
  setNewItem?: Setter
}): JSX.Element | undefined => {
  const ydoc = useYDocument<Y.Map<unknown>>(props.documentId, {
    data: props.data,
    ignoreChangeKeys: [
      'meta.core/description[@internalDescriptionIndex].data.text[0]', // internal description
      'meta.core/assignment[*].meta.core/description[0].data.text[0]', // assignment description
      'meta.core/assignment[*].data.start' // assignment start
    ]
  })
  const { provider, ele: document, connected } = ydoc

  const { data: session, status } = useSession()
  const [documentStatus] = useWorkflowStatus({ ydoc })
  const [copyGroupId] = useYValue<string | undefined>(document, 'meta.core/copy-group[0].uuid')
  const [newTitle] = useYValue(document, ['root', 'title'])
  const [relatedEvents] = useYValue<Block[]>(document, 'links.core/event')

  const [title] = useYValue<Y.XmlText>(document, 'root.title', true)
  const [slugline] = useYValue<Y.XmlText>(document, 'meta.tt/slugline[0].value', true)
  const pubIndex = useDescriptionIndex(document, 'public')
  const intIndex = useDescriptionIndex(document, 'internal')
  const [publicDescription] = useYValue<Y.XmlText>(document, `meta.core/description[${pubIndex}].data.text`, true)
  const [internalDescription] = useYValue<Y.XmlText>(document, `meta.core/description[${intIndex}].data.text`, true)
  const { t } = useTranslation()

  const handleSubmit = async ({ documentStatus }: {
    documentStatus: 'usable' | 'done' | undefined
  }): Promise<void> => {
    if (props?.setNewItem) {
      props.setNewItem({ uuid: props.documentId, title: newTitle as string })
    }

    if (provider && status === 'authenticated') {
      try {
        await snapshotDocument(props.documentId, {
          status: documentStatus,
          addToHistory: true
        }, ydoc.provider?.document)

        if (props?.onDialogClose) {
          props.onDialogClose()
        }

        toast.success(t('views:plannings.toasts.create.success'), {
          classNames: {
            title: 'whitespace-nowrap'
          },
          action: (
            <ToastAction
              key='open-planning'
              documentId={props.documentId}
              withView='Planning'
              label={t('views:plannings.toasts.openItem')}
              Icon={CalendarDaysIcon}
              target='last'
            />
          )
        })
      } catch (ex) {
        console.error('Failed to snapshot document', ex)
        toast.error(t('views:plannings.toasts.create.error'), {
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
    <View.Root asDialog={props.asDialog} className={props?.className}>
      <PlanningHeader
        ydoc={ydoc}
        asDialog={!!props.asDialog}
        onDialogClose={props.onDialogClose}
        session={session}
        provider={provider}
        status={status}
      />

      <View.Content className='max-w-[1000px]'>
        <Form.Root asDialog={props.asDialog}>
          <Form.Content>
            <Form.Title>
              <TextInput
                ydoc={ydoc}
                value={title}
                label={t('core:labels.title')}
                placeholder={t('planning:title')}
                autoFocus={props.asDialog === true}
              />
            </Form.Title>

            <TextBox
              ydoc={ydoc}
              value={publicDescription}
              icon={<TextIcon size={18} strokeWidth={1.75} className='text-muted-foreground mr-4' />}
              placeholder={t('planning:description.public')}
            />

            <TextBox
              ydoc={ydoc}
              value={internalDescription}
              icon={<MessageCircleMoreIcon size={18} strokeWidth={1.75} className='text-muted-foreground mr-4' />}
              placeholder={t('planning:description.internal')}
            />

            <Form.Group icon={CalendarIcon}>
              <PlanDate ydoc={ydoc} asDialog={!!props.asDialog} />
            </Form.Group>

            <Form.Group icon={TagsIcon}>
              <SluglineEditable
                ydoc={ydoc}
                value={slugline}
                documentStatus={documentStatus?.name}
              />

              <Newsvalue ydoc={ydoc} path='meta.core/newsvalue[0].value' />
            </Form.Group>

            <Form.Group icon={TagsIcon}>
              <Section ydoc={ydoc} path='links.core/section[0]' />
              <Story ydoc={ydoc} path='links.core/story[0]' />
            </Form.Group>
          </Form.Content>

          <Form.Table>
            <AssignmentTable
              ydoc={ydoc}
              asDialog={props.asDialog}
              documentId={props.documentId}
            />
            <RelatedEvents events={relatedEvents} />
            {!props.asDialog && <DuplicatesTable documentId={props.documentId} type='core/planning-item' />}
            {copyGroupId && !props.asDialog && <CopyGroup copyGroupId={copyGroupId} type='core/planning-item' />}
          </Form.Table>

          <Form.Footer>
            {!environmentIsSane && (
              <UserMessage asDialog={!!props.asDialog} className='pb-6'>
                {t('common:errors.unwellEnvironment')}
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
                  {t('core:status.action.publish')}
                </Button>
              </div>
            </Form.Submit>
          </Form.Footer>
        </Form.Root>
      </View.Content>
    </View.Root>
  )
}

Planning.meta = meta
