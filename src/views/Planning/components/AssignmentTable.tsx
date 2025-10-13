import { InfoIcon, PlusIcon } from '@ttab/elephant-ui/icons'
import { AssignmentRow } from './AssignmentRow'
import { appendAssignment } from '@/shared/createYItem'
import { useAuthors, useCollaboration, useNavigationKeys } from '@/hooks'
import { Assignment } from './Assignment'
import type { MouseEvent, KeyboardEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { deleteByYPath, getValueByYPath, setValueByYPath } from '@/shared/yUtils'
import { Button } from '@ttab/elephant-ui'
import { useActiveAuthor } from '@/hooks/useActiveAuthor'
import { snapshotDocument } from '@/lib/snapshotDocument'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { getAuthorBySub } from '@/lib/getAuthorBySub'
import { type YDocument, useYValue } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'

export const AssignmentTable = ({ ydoc, asDialog = false, documentId, onChange }: {
  ydoc: YDocument<Y.Map<unknown>>
  asDialog?: boolean
  documentId?: string
  onChange?: (arg: boolean) => void
}): JSX.Element => {
  const { provider } = useCollaboration()
  const [assignments] = useYValue<Y.Array<Y.Map<unknown>>>(ydoc.document, 'meta.core/assignment', true)
  const [planningSlugLine] = useYValue<string | undefined>(ydoc.document, 'meta.tt/slugline[0].value')
  const [selectedAssignment, setSelectedAssignment] = useState<Y.Map<unknown> | undefined>(undefined)
  const [newAssignment, setNewAssignment] = useState<Y.Map<unknown> | undefined>(undefined)
  const [focusedRowIndex, setFocusedRowIndex] = useState<number | undefined>()
  const author = useActiveAuthor({ full: false })
  const { data: session } = useSession()
  const authors = useAuthors()

  useEffect(() => {
    for (const a of assignments ?? []) {
      if ((a.get('__inProgress') as Y.Map<unknown>)?.get('sub') === session?.user.sub) {
        setNewAssignment(a)
      }
    }
  }, [assignments, session?.user.sub])

  const slugLines = useMemo(() => {
    const slugs = []
    for (const a of assignments ?? []) {
      slugs.push(getValueByYPath<string>(a, 'meta.tt/slugline[0].value')?.[0])
    }
    return slugs
  }, [assignments])

  const handleNewAssignment = (event: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (newAssignment || selectedAssignment != null || !ydoc.provider) {
      return
    }

    const [, createdAssignment] = appendAssignment({
      document: ydoc.provider.document,
      inProgress: {
        sub: session?.user.sub ?? ''
      },
      assignee: author,
      slugLine: (!slugLines?.includes(planningSlugLine || ''))
        ? planningSlugLine
        : undefined,
      type: 'text'
    })

    setNewAssignment(createdAssignment)
  }

  const handleClose = () => {
    if (!newAssignment) return

    const [assignmentType] = getValueByYPath(newAssignment, 'meta.core/assignment-type[0].value')
    if (assignmentType !== 'text' && assignmentType !== 'editorial-info') {
      deleteByYPath(newAssignment, 'meta.[tt/slugline]')
    }
    newAssignment.delete('__inProgress')

    if (documentId) {
      snapshotDocument(documentId, { force: true }, provider?.document)
        .then(() => {
          setNewAssignment(undefined)
          onChange?.(true)
        })
        .catch((ex) => {
          console.error('Error closing assignment:', ex)
          toast.error('Kunde inte spara uppdraget.')
        })
    }
  }

  const handleAbort = () => {
    if (!newAssignment) return

    const index = (assignments?.toArray() ?? []).findIndex((assignment) => {
      return assignment.get('id') === newAssignment?.get('id')
    }) ?? -1

    setNewAssignment(undefined)
    if (index > -1 && assignments) {
      assignments.delete(index)
    }
  }

  useNavigationKeys({
    keys: ['ArrowUp', 'ArrowDown'],
    onNavigation: (event) => {
      if (!assignments?.length) return
      const idx = (focusedRowIndex === undefined)
        ? (event.key === 'ArrowDown' ? 0 : assignments?.length - 1)
        : (focusedRowIndex + (event.key === 'ArrowDown' ? 1 : -1) + assignments.length) % assignments.length
      setFocusedRowIndex(idx)
    }
  })

  return (
    <>
      <div className='flex flex-col pt-2 text-primary pb-4'>
        <div className='pl-2'>
          <Button
            disabled={newAssignment !== undefined || !ydoc.connected}
            variant='ghost'
            onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => event.key === 'Enter'
              && handleNewAssignment(event)}
            onClick={(event: MouseEvent<HTMLButtonElement>) => handleNewAssignment(event)}
          >

            <div className='flex flex-row items-center gap-2'>
              <div className='bg-primary rounded-full w-5 h-5 relative'>
                <PlusIcon
                  size={15}
                  strokeWidth={2.25}
                  color='#FFFFFF'
                  className='absolute inset-0 m-auto'
                />
              </div>
              Lägg till uppdrag
            </div>
          </Button>
        </div>


        {!!assignments?.length && (
          <>
            {assignments.map((assignment, index: number) => {
              const [sub] = getValueByYPath<string>(assignment, '__inProgress.sub')
              if (!sub || sub === session?.user.sub) {
                return null
              }
              const user = getAuthorBySub(authors, sub)

              return (
                <div key={`${assignment.get('id') as string}`} className='border-b last:border-0'>
                  <div className='text-sm ps-6 py-2 flex flex-row gap-2 text-muted-foreground items-center'>
                    <InfoIcon size={18} strokeWidth={1.75} />
                    <div>
                      <span className='hidden sm:inline'>Nytt uppdrag skapas av</span>
                      {' '}
                      {user?.name || `okänd: ${sub ?? 'användare'}`}
                      {', '}
                      <a
                        className='text-primary hover:underline'
                        href='#'
                        onClick={(e) => {
                          e.preventDefault()
                          setValueByYPath(
                            ydoc.document,
                            `meta.core/assignment[${index}].__inProgress.sub`,
                            session?.user.sub
                          )
                        }}
                      >
                        Ta över
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}

      </div>

      {newAssignment && (
        <div className='pb-6'>
          <Assignment
            ydoc={ydoc}
            assignment={newAssignment}
            onAbort={handleAbort}
            onClose={handleClose}
            className='mb-6'
          />
        </div>
      )}

      {!!assignments?.length && (
        <div className='border rounded-md'>
          {assignments.map((assignment, index: number) => (
            <div key={`${assignment.get('id') as string}`} className='border-b last:border-0'>
              {selectedAssignment?.get('id') === assignment.get('id')
                && (
                  <Assignment
                    ydoc={ydoc}
                    assignment={assignment}
                    onChange={onChange}
                    onClose={() => setSelectedAssignment(undefined)}
                    className='-my-px -mx-[5px]'
                  />
                )}

              {selectedAssignment?.get('id') !== assignment.get('id') && newAssignment?.get('id') !== assignment.get('id')
                && (
                  <AssignmentRow
                    ydoc={ydoc}
                    assignment={assignment}
                    isFocused={index === focusedRowIndex}
                    asDialog={asDialog}
                    onChange={onChange}
                    onSelect={() => {
                      if (!newAssignment) {
                        setSelectedAssignment(assignment)
                      }
                    }}
                  />
                )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
