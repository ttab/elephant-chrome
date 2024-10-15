import {
  AwarenessDocument,
  ViewHeader,
  DocumentStatus,
  VisibilityStatus,
  Newsvalue,
  Title,
  Description,
  Story,
  Section
} from '@/components'
import { type ValidateState, type ViewMetadata, type ViewProps } from '@/types'
import { Button, ScrollArea, Separator } from '@ttab/elephant-ui'
import { GanttChartSquare } from '@ttab/elephant-ui/icons'
import {
  useCollaboration,
  useQuery,
  useYValue,
  useDocumentStatus
} from '@/hooks'
import { SluglineEditable } from '@/components/DataItem/SluglineEditable'
import {
  AssignmentTable,
  PlanDate
} from './components'

import type * as Y from 'yjs'
import { cva } from 'class-variance-authority'
import { cn } from '@ttab/elephant-ui/utils'
import { createStateless, StatelessType } from '@/shared/stateless'
import { useSession } from 'next-auth/react'
import { useRef, useState } from 'react'
import { ValidationAlert } from '@/components/ValidationAlert'
import { Error } from '../Error'

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
  const query = useQuery()
  const documentId = props.id || query.id

  return (
    <>
      {documentId
        ? <AwarenessDocument documentId={documentId} document={props.document}>
          <PlanningViewContent {...props} documentId={documentId} />
        </AwarenessDocument>
        : <Error
            title='Planeringsdokument saknas'
            message='Inget planeringsdokument är angivet. Navigera tillbaka till översikten och försök igen.'
        />
      }
    </>
  )
}

const PlanningViewContent = (props: ViewProps & { documentId: string }): JSX.Element | undefined => {
  const { provider } = useCollaboration()
  const { data, status } = useSession()
  const [documentStatus, setDocumentStatus] = useDocumentStatus(props.documentId)
  const [validateForm, setValidateForm] = useState<boolean>(!props.asDialog)
  const validateStateRef = useRef<ValidateState>({})

  const handleValidation = (block: string, label: string, value: string | undefined, reason: string): boolean => {
    validateStateRef.current = {
      ...validateStateRef.current,
      [block]: { label, valid: !!value, reason }
    }

    if (validateForm) {
      return !!value
    }

    return true
  }

  const viewVariants = cva('flex flex-col', {
    variants: {
      asCreateDialog: {
        false: 'h-screen',
        true: 'overflow-hidden'
      }
    }
  })

  const sectionVariants = cva('overscroll-auto @5xl:w-[1024px] space-y-5', {
    variants: {
      asCreateDialog: {
        false: 'p-8',
        true: 'p-6'
      }
    }
  })

  const [title] = useYValue<string | undefined>('title')


  return (
    <div className={cn(viewVariants({
      asCreateDialog: !!props.asDialog,
      className: props?.className
    }))}>
      <div className="grow-0">
        <ViewHeader.Root>
          {!props.asDialog &&
            <ViewHeader.Title title='Planering' icon={GanttChartSquare} iconColor='#DAC9F2' />
          }

          <ViewHeader.Content>
            <div className='flex w-full h-full items-center space-x-2'>
              {!props.asDialog &&
                <DocumentStatus status={documentStatus} setStatus={setDocumentStatus} />}
              <VisibilityStatus />
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
        <section className={cn(sectionVariants({ asCreateDialog: !!props?.asDialog }))}>
          <ValidationAlert validateStateRef={validateStateRef} />

          <div className='flex flex-col gap-2 pl-0.5'>
            <div className='flex space-x-2 items-start'>
              <Title
                autoFocus={props.asDialog}
                placeholder='Planeringsrubrik'
                onValidation={handleValidation}
              />
              <div className='min-w-32'>
                <SluglineEditable
                  path='meta.tt/slugline[0].value'
                  documentStatus={documentStatus?.name}
                  onValidation={handleValidation}
                />
              </div>
            </div>

            <Description role="public" />
            <Description role="internal" />
          </div>

          <div className="flex flex-col space-y-2">
            <div className='-ml-2'>
              <PlanDate />
            </div>
            <div className='flex space-x-2'>
              <Section onValidation={handleValidation} />
              <Story />
            </div>
          </div>

          <AssignmentTable />
        </section>

        {props.asDialog && (
          <div>
            <Separator className='ml-0' />
            <div className='flex justify-end px-6 py-4'>
              <Button onClick={(): void => {
                setValidateForm(true)
                // if all fields are valid close and save
                if (Object.values(validateStateRef.current).every((block) => block.valid)) {
                  // Get the id, post it, and open it in a view?
                  if (props?.onDialogClose) {
                    props.onDialogClose(props.documentId, title)
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
              }}>
                Skapa planering
              </Button>
            </div>
          </div>)}

      </ScrollArea>
    </div>
  )
}

Planning.meta = meta
