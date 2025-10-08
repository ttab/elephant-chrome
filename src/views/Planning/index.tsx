import {
  Newsvalue,
  Title,
  Story,
  Section,
  View,
  UserMessage
} from '@/components'
import { type ViewMetadata, type ViewProps } from '@/types'
import { TagsIcon, CalendarIcon, MessageCircleIcon, TextIcon } from '@ttab/elephant-ui/icons'
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
import React, { type SetStateAction, useMemo, useState } from 'react'
import type { NewItem } from '../Event/components/PlanningTable'
import { MoveDialog } from './components/MoveDialog'
import { RelatedEvents } from './components/RelatedEvents'
import type { Block } from '@ttab/elephant-api/newsdoc'
import { CopyGroup } from '../../components/CopyGroup'
import { DuplicatesTable } from '../../components/DuplicatesTable'
import { snapshotDocument } from '@/lib/snapshotDocument'
import { toast } from 'sonner'
import { useYDocument, useYValue } from '../../modules/yjs/hooks'
import { getTemplateFromView } from '@/shared/templates/lib/getTemplateFromView'
import { toGroupedNewsDoc } from '@/shared/transformations/groupedNewsDoc'
import type { EleDocumentResponse } from '@/shared/types'
import { TextBox } from '@/components/ui'
import { useDescriptionIndex } from './_utils/useDescriptionIndex'
import { TextInput } from '@/components/ui/TextInput'

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
  document?: Y.Doc
  setNewItem?: Setter
}): JSX.Element => {
  const [query] = useQuery()
  const documentId = props.id || query.id

  // Planning should be responsible for creating new as well as editing,
  // ignore incoming document.
  const data = useMemo(() => {
    if (!props.document || !documentId || typeof documentId !== 'string') {
      return undefined
    }

    return toGroupedNewsDoc({
      version: 0n,
      isMetaDocument: false,
      mainDocument: '',
      document: getTemplateFromView('Planning')(documentId)
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
              title='Planeringsdokument saknas'
              message='Inget planeringsdokument är angivet. Navigera tillbaka till översikten och försök igen.'
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
  const ydoc = useYDocument<Y.Map<unknown>>(props.documentId, { data: props.data })
  const { provider, document, isChanged, setIsChanged, connected, synced } = ydoc

  const { data: session, status } = useSession()
  const [documentStatus] = useWorkflowStatus(props.documentId)
  const [copyGroupId] = useYValue<string | undefined>(document, 'meta.core.copy-group[0].uuid')
  const [newTitle] = useYValue(document, ['root', 'title'])
  const [relatedEvents] = useYValue<Block[]>(document, 'links.core/event')
  const [newDate, setNewDate] = useState<string | undefined>(undefined)

  const [title] = useYValue<Y.XmlText>(document, 'root.title', true)
  const pubIndex = useDescriptionIndex(document, 'public')
  const intIndex = useDescriptionIndex(document, 'internal')
  const [publicDescription] = useYValue<Y.XmlText>(document, ['meta', 'core/description', pubIndex, 'data', 'text'], true)
  const [internalDescription] = useYValue<Y.XmlText>(document, ['meta', 'core/description', intIndex, 'data', 'text'], true)

  // FIXME: Remove console.log
  console.log('synced', connected, synced)

  const handleSubmit = ({ documentStatus }: {
    documentStatus: 'usable' | 'done' | undefined
  }): void => {
    if (provider && status === 'authenticated') {
      void snapshotDocument(props.documentId, {
        status: documentStatus,
        addToHistory: true
      }).then((response) => {
        if (response?.statusMessage) {
          toast.error('Kunde inte skapa ny planering!', {
            duration: 5000,
            position: 'top-center'
          })
          return
        }

        if (props?.onDialogClose) {
          props.onDialogClose()
        }
      })
    }

    if (props?.setNewItem) {
      props.setNewItem({ uuid: props.documentId, title: newTitle as string })
    }
  }

  const environmentIsSane = connected && status === 'authenticated'

  return (
    <View.Root asDialog={props.asDialog} className={props?.className}>
      <PlanningHeader
        ydoc={ydoc}
        asDialog={!!props.asDialog}
        onDialogClose={props.onDialogClose}
        isChanged={isChanged}
        session={session}
        provider={provider}
        status={status}
      />

      <View.Content className='max-w-[1000px]'>
        <Form.Root asDialog={props.asDialog} onChange={setIsChanged}>
          <Form.Content>
            <Form.Title>
              <TextInput
                ydoc={ydoc}
                value={title}
                label='Titel'
                autoFocus={!!props.asDialog}
                placeholder='Planeringstitel'
              />
            </Form.Title>

            <TextBox
              ydoc={ydoc}
              value={publicDescription}
              icon={<TextIcon size={18} strokeWidth={1.75} className='text-muted-foreground mr-4' />}
              placeholder='Publik beskrivning'
            />

            <TextBox
              ydoc={ydoc}
              value={internalDescription}
              icon={<MessageCircleIcon size={18} strokeWidth={1.75} className='text-muted-foreground mr-4' />}
              placeholder='Internt meddelande'
            />

            <Form.Group icon={CalendarIcon}>
              {props.asDialog !== true
                ? <PlanDate onValueChange={setNewDate} />
                : <PlanDate />}

              {newDate && props.asDialog !== true && (
                <MoveDialog
                  newDate={newDate}
                  onChange={setIsChanged}
                  onClose={() => {
                    setNewDate(undefined)
                  }}
                />
              )}
            </Form.Group>

            <Form.Group icon={TagsIcon}>
              <SluglineEditable
                ydoc={ydoc}
                path='meta.tt/slugline[0].value'
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
            <AssignmentTable ydoc={ydoc} asDialog={props.asDialog} onChange={setIsChanged} documentId={props.documentId} />
            <RelatedEvents events={relatedEvents} />
            {!props.asDialog && <DuplicatesTable documentId={props.documentId} type='core/planning-item' />}
            {copyGroupId && !props.asDialog && <CopyGroup copyGroupId={copyGroupId} type='core/planning-item' />}
          </Form.Table>

          <Form.Footer>
            {!environmentIsSane && (
              <div className='pb-6'>
                <UserMessage asDialog={!!props.asDialog}>
                  Du har blivit utloggad eller tappat kontakt med systemet.
                  Vänligen försök logga in igen.
                </UserMessage>
              </div>

            )}

            <Form.Submit
              onSubmit={() => handleSubmit({ documentStatus: 'usable' })}
              onSecondarySubmit={() => handleSubmit({ documentStatus: 'done' })}
              onTertiarySubmit={() => handleSubmit({ documentStatus: undefined })}
            >
              <div className='flex justify-between'>
                <div className='flex gap-2'>
                  <Button type='button' variant='secondary' role='tertiary' disabled={!environmentIsSane}>
                    Utkast
                  </Button>
                  <Button type='button' variant='secondary' role='secondary' disabled={!environmentIsSane}>
                    Intern
                  </Button>
                </div>
                <Button type='submit' disabled={!environmentIsSane}>
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

Planning.meta = meta
