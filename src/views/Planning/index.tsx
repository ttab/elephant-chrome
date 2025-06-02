import {
  AwarenessDocument,
  Newsvalue,
  Title,
  Description,
  Story,
  Section,
  View
} from '@/components'
import { type ViewMetadata, type ViewProps } from '@/types'
import { Tags, Calendar } from '@ttab/elephant-ui/icons'
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
import { createStateless, StatelessType } from '@/shared/stateless'
import { useSession } from 'next-auth/react'
import { PlanningHeader } from './components/PlanningHeader'
import React, { type SetStateAction, useCallback, useEffect, useState } from 'react'
import type { NewItem } from '../Event/components/PlanningTable'
import { MoveDialog } from './components/MoveDialog'

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
  const [, setIsFocused] = useAwareness(props.documentId)
  const [newTitle] = useYValue('root.title')
  const [isChanged] = useYValue<boolean>('root.changed')
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
    if (props.onDialogClose) {
      props.onDialogClose(props.documentId, 'title')
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
            type: 'Planning'
          }
        })
      )
    }
    if (props?.setNewItem) {
      props.setNewItem({ uuid: props.documentId, title: newTitle as string })
    }
  }

  return (
    <View.Root asDialog={props.asDialog} className={props?.className}>
      <PlanningHeader
        documentId={props.documentId}
        asDialog={!!props.asDialog}
        onDialogClose={props.onDialogClose}
        isChanged={isChanged}
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

            <Form.Group icon={Calendar}>
              <PlanDate
                onValueChange={(value) => {
                  setNewDate(value)
                }}
              />

              {newDate && (
                <MoveDialog
                  newDate={newDate}
                  onClose={() => {
                    setNewDate(undefined)
                  }}
                />
              )}
            </Form.Group>

            <Form.Group icon={Tags}>
              <SluglineEditable
                path='meta.tt/slugline[0].value'
                documentStatus={documentStatus?.name}
              />
              <Newsvalue />
            </Form.Group>

            <Form.Group icon={Tags}>
              <Section />
              <Story />
            </Form.Group>

          </Form.Content>

          <Form.Table>
            <AssignmentTable asDialog={props.asDialog} onChange={handleChange} />
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

Planning.meta = meta
