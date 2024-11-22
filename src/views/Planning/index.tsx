import {
  AwarenessDocument,
  ViewHeader,
  DocumentStatus,
  Newsvalue,
  Title,
  Description,
  Story,
  Section,
  View
} from '@/components'
import { type ViewMetadata, type ViewProps } from '@/types'
import { GanttChartSquare, Tags, Calendar } from '@ttab/elephant-ui/icons'
import {
  useQuery,
  useDocumentStatus,
  useCollaboration
} from '@/hooks'
import {
  AssignmentTable,
  PlanDate
} from './components'

import type * as Y from 'yjs'
import { Error } from '../Error'
import { Form } from '@/components/Form'
import { SluglineEditable } from '@/components/DataItem/SluglineEditable'
import { Button } from '@ttab/elephant-ui'
import { createStateless, StatelessType } from '@/shared/stateless'
import { useSession } from 'next-auth/react'

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

export const Planning = (props: ViewProps & { document?: Y.Doc }): JSX.Element => {
  const [query] = useQuery()
  const documentId = props.id || query.id

  return (
    <>
      {typeof documentId === 'string'
        ? (
            <AwarenessDocument documentId={documentId} document={props.document}>
              <PlanningViewContent {...props} documentId={documentId} />
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

const PlanningViewContent = (props: ViewProps & { documentId: string }): JSX.Element | undefined => {
  const { provider } = useCollaboration()
  const { data, status } = useSession()
  const [documentStatus, setDocumentStatus] = useDocumentStatus(props.documentId)

  const handleSubmit = (): void => {
    if (props.onDialogClose) {
      props.onDialogClose(props.documentId, 'title')
    }

    if (provider && status === 'authenticated') {
      provider.sendStateless(
        createStateless(StatelessType.IN_PROGRESS, {
          state: false,
          id: props.documentId,
          context: {
            accessToken: data.accessToken,
            user: data.user,
            type: 'Planning'
          }
        })
      )
    }
  }

  return (
    <View.Root asDialog={props.asDialog} className={props?.className}>
      <ViewHeader.Root asDialog={!!props.asDialog}>
        {!props.asDialog
          ? <ViewHeader.Title title='Planering' icon={GanttChartSquare} iconColor='#DAC9F2' />
          : <ViewHeader.Title title='Skapa ny planering' icon={GanttChartSquare} iconColor='#DAC9F2' asDialog />}

        <ViewHeader.Content>
          <div className='flex w-full h-full items-center space-x-2'>
            {!props.asDialog && <DocumentStatus status={documentStatus} setStatus={setDocumentStatus} />}
          </div>
        </ViewHeader.Content>

        <ViewHeader.Action onDialogClose={props.onDialogClose}>
          {!props.asDialog && !!props.documentId && <ViewHeader.RemoteUsers documentId={props.documentId} />}
        </ViewHeader.Action>
      </ViewHeader.Root>

      <View.Content className='max-w-[1000px]'>
        <Form.Root asDialog={props.asDialog}>
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
              <PlanDate />
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
            <AssignmentTable asDialog={props.asDialog} />
          </Form.Table>

          <Form.Footer>
            <Form.Submit documentId={props.documentId} onSubmit={handleSubmit}>
              <div className='flex justify-end'>
                <Button
                  type='submit'
                >
                  Skapa planering
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
