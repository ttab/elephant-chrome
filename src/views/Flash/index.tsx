import {
  AwarenessDocument,
  ViewHeader,
  DocumentStatus,
  VisibilityStatus,
  Newsvalue,
  Title,
  Section
} from '@/components'
import { type ViewMetadata, type ViewProps } from '@/types'
import { Button, ScrollArea, Separator } from '@ttab/elephant-ui'
import { ZapIcon } from '@ttab/elephant-ui/icons'
import {
  useCollaboration,
  useQuery,
  useYValue,
  useDocumentStatus
} from '@/hooks'

import type * as Y from 'yjs'
import { cva } from 'class-variance-authority'
import { cn } from '@ttab/elephant-ui/utils'
import { createStateless, StatelessType } from '@/shared/stateless'
import { useSession } from 'next-auth/react'

const meta: ViewMetadata = {
  name: 'Flash',
  path: `${import.meta.env.BASE_URL || ''}/flash`,
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


export const Flash = (props: ViewProps & { document?: Y.Doc }): JSX.Element => {
  const query = useQuery()
  const documentId = props.id || query.id

  return (
    <>
      {documentId
        ? <AwarenessDocument documentId={documentId} document={props.document}>
          <FlashViewContent {...props} documentId={documentId} />
        </AwarenessDocument>
        : <></>
      }
    </>
  )
}

const FlashViewContent = (props: ViewProps & { documentId: string }): JSX.Element | undefined => {
  const { provider } = useCollaboration()
  const { data, status } = useSession()
  const [documentStatus, setDocumentStatus] = useDocumentStatus(props.documentId)

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
    <div className={cn(viewVariants({ asCreateDialog: !!props.asDialog, className: props?.className }))}>
      <div className="grow-0">
        <ViewHeader.Root>
          {!props.asDialog &&
            <ViewHeader.Title title='Flash' icon={ZapIcon} iconColor='#FF5150' />
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
          <div className='flex flex-col gap-2 pl-0.5'>
            <Title
              autoFocus={props.asDialog}
              placeholder='Rubrik'
            />
          </div>

          <div className="flex flex-col space-y-2">
            <Section />
          </div>

          {/* <AssignmentTable /> */}
        </section>

        {props.asDialog && (
          <div>
            <Separator className='ml-0' />
            <div className='flex justify-end px-6 py-4'>
              <Button onClick={(): void => {
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
                        accessToken: data.accessToken
                      }
                    })
                  )
                }
              }}>
                Skapa flash
              </Button>
            </div>
          </div>)}

      </ScrollArea>
    </div>
  )
}

Flash.meta = meta
