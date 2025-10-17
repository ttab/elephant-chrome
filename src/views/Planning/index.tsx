import {
  AwarenessDocument,
  Newsvalue,
  Title,
  Description,
  Story,
  Section,
  View,
  UserMessage
} from '@/components'
import { type ViewMetadata, type ViewProps } from '@/types'
import { TagsIcon, CalendarIcon } from '@ttab/elephant-ui/icons'
import {
  useQuery,
  useWorkflowStatus,
  useCollaboration,
  useAwareness,
  useYValue
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
import React, { type SetStateAction, useCallback, useEffect, useState } from 'react'
import type { NewItem } from '../Event/components/PlanningTable'
import { MoveDialog } from './components/MoveDialog'
import { RelatedEvents } from './components/RelatedEvents'
import type { Block } from '@ttab/elephant-api/newsdoc'
import { CopyGroup } from '../../components/CopyGroup'
import { DuplicatesTable } from '../../components/DuplicatesTable'
import { snapshotDocument } from '@/lib/snapshotDocument'
import { toast } from 'sonner'

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

export const Planning = (props: ViewProps & { document?: Y.Doc, setNewItem?: Setter }): JSX.Element => {
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
              <PlanningViewContent {...props} documentId={documentId} setNewItem={props?.setNewItem} />
            </AwarenessDocument>
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

const PlanningViewContent = (props: ViewProps & { documentId: string, setNewItem?: Setter }): JSX.Element | undefined => {
  const { provider, user } = useCollaboration()
  const { data, status } = useSession()
  const [documentStatus] = useWorkflowStatus(props.documentId)
  const [copyGroupId] = useYValue<string | undefined>('meta.core/copy-group[0].uuid')
  const [, setIsFocused] = useAwareness(props.documentId)
  const [newTitle] = useYValue('root.title')
  const [isChanged] = useYValue<boolean>('root.changed')
  const [relatedEvents] = useYValue<Block[]>('links.core/event')
  const [newDate, setNewDate] = useState<string | undefined>(undefined)

  useEffect(() => {
    provider?.setAwarenessField('data', user)
    setIsFocused(true)

    return () => {
      setIsFocused(false)
    }

    // We only want to rerun when provider change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider])

  // TODO: useYValue doesn't provider a stable setter, this cause rerenders down the tree
  const handleChange = useCallback((value: boolean): void => {
    const root = provider?.document.getMap('ele').get('root') as Y.Map<unknown>
    const changed = root.get('changed') as boolean


    if (changed !== value) {
      root.set('changed', value)
    }
  }, [provider])


  const handleSubmit = ({ documentStatus }: {
    documentStatus: 'usable' | 'done' | undefined
  }): void => {
    if (provider && status === 'authenticated') {
      snapshotDocument(props.documentId, {
        status: documentStatus,
        addToHistory: true
      }).then(() => {
        if (props?.onDialogClose) {
          props.onDialogClose()
        }
      }).catch((ex: unknown) => {
        console.error('Failed to snapshot document', ex)
        toast.error('Kunde inte skapa ny planering!', {
          duration: 5000,
          position: 'top-center'
        })
        return
      })
    }

    if (props?.setNewItem) {
      props.setNewItem({ uuid: props.documentId, title: newTitle as string })
    }
  }

  const environmentIsSane = provider && status === 'authenticated'

  return (
    <View.Root asDialog={props.asDialog} className={props?.className}>
      <PlanningHeader
        documentId={props.documentId}
        asDialog={!!props.asDialog}
        onDialogClose={props.onDialogClose}
        isChanged={isChanged}
        session={data}
        provider={provider}
        status={status}
      />

      <View.Content className='max-w-[1000px]'>
        <Form.Root asDialog={props.asDialog} onChange={handleChange}>
          <Form.Content>
            <Form.Title>
              <Title
                autoFocus={props.asDialog}
                placeholder='Planeringstitel'
              />
            </Form.Title>
            <Description role='public' />
            <Description role='internal' />

            <Form.Group icon={CalendarIcon}>
              {props.asDialog !== true
                ? <PlanDate onValueChange={setNewDate} />
                : <PlanDate />}

              {newDate && props.asDialog !== true && (
                <MoveDialog
                  newDate={newDate}
                  onChange={handleChange}
                  onClose={() => {
                    setNewDate(undefined)
                  }}
                />
              )}
            </Form.Group>

            <Form.Group icon={TagsIcon}>
              <SluglineEditable
                path='meta.tt/slugline[0].value'
                documentStatus={documentStatus?.name}
              />
              <Newsvalue />
            </Form.Group>

            <Form.Group icon={TagsIcon}>
              <Section />
              <Story />
            </Form.Group>

          </Form.Content>

          <Form.Table>
            <AssignmentTable asDialog={props.asDialog} onChange={handleChange} documentId={props.documentId} />
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
