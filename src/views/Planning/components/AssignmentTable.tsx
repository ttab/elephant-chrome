import { InfoIcon, PlusIcon } from '@ttab/elephant-ui/icons'
import { AssignmentRow } from './AssignmentRow'
import { createNewAssignment } from '@/shared/createYItem'
import { useAuthors, useNavigationKeys } from '@/hooks'
import { Assignment } from './Assignment'
import type { MouseEvent, KeyboardEvent } from 'react'
import { useMemo, useState } from 'react'
import { deleteByYPath, getValueByYPath, setValueByYPath } from '@/shared/yUtils'
import { Button } from '@ttab/elephant-ui'
import { useActiveAuthor } from '@/hooks/useActiveAuthor'
import { snapshotDocument } from '@/lib/snapshotDocument'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { getAuthorBySub } from '@/lib/getAuthorBySub'
import { type YDocument, useYValue } from '@/modules/yjs/hooks'
import * as Y from 'yjs'
import type { EleBlock } from '@/shared/types'
import { fromYStructure, getValueFromPath, toYStructure } from '@/modules/yjs/lib/yjs'

export const AssignmentTable = ({ ydoc, asDialog = false, documentId, onChange }: {
  ydoc: YDocument<Y.Map<unknown>>
  asDialog?: boolean
  documentId?: string
  onChange?: (arg: boolean) => void
}): JSX.Element => {
  const { data: session } = useSession()
  const [assignments] = useYValue<EleBlock[]>(ydoc.ele, 'meta.core/assignment')
  const [rawAssignments] = useYValue<Y.Array<Y.Map<unknown>>>(ydoc.ele, 'meta.core/assignment', true)
  const [planningSlugLine] = useYValue<string | undefined>(ydoc.ele, 'meta.tt/slugline[0].value')
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)
  const [newAssignment] = useYValue<EleBlock>(ydoc.meta, `core/assignment.${session?.user.sub || ''}`)
  const [focusedRowIndex, setFocusedRowIndex] = useState<number | undefined>()
  const author = useActiveAuthor({ full: false })
  const authors = useAuthors()

  const selectedAssignment = useMemo(() => {
    if (!selectedId) return undefined
    const index = assignments?.findIndex((assignment) => assignment.id === selectedId) ?? -1

    return getValueByYPath<Y.Map<unknown>>(
      ydoc.ele,
      `meta.core/assignment[${index}]`,
      true
    )?.[0]
  }, [ydoc.ele, selectedId, assignments])

  const slugLines = useMemo(() => {
    return (assignments ?? []).map((_, i) => {
      return getValueByYPath<string>(
        ydoc.ele,
        `meta.core/assignment[${i}].meta.tt/slugline[0].value`
      )?.[0]
    })
  }, [ydoc.ele, assignments])

  const handleNewAssignment = (event: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    if (!session || !ydoc.provider) {
      return
    }

    if (!ydoc.meta.get('core/assignment')) {
      ydoc.meta.set('core/assignment', new Y.Map())
    }

    (ydoc.meta.get('core/assignment') as Y.Map<unknown>).set(
      session.user.sub,
      createNewAssignment({
        document: ydoc.provider.document,
        assignee: author,
        slugLine: (!slugLines?.includes(planningSlugLine || ''))
          ? planningSlugLine
          : undefined,
        type: 'text'
      })
    )
  }

  const handleClose = () => {
    if (!rawAssignments || !newAssignment || !session) return

    const assignment = getValueFromPath<Y.Map<unknown>>(ydoc.meta, ['core/assignment', session?.user.sub], true)
    if (!assignment) return

    const [assignmentType] = getValueByYPath<string>(assignment, ['meta', 'core/assignment-type', 0, 'value'])
    if (assignmentType && !['text', 'editorial-info'].includes(assignmentType)) {
      deleteByYPath(assignment, ['meta', 'tt/slugline'])
    }

    rawAssignments?.push([
      toYStructure(
        fromYStructure(assignment)
      ) as Y.Map<unknown>
    ])
    deleteByYPath(ydoc.meta, ['core/assignment', session?.user.sub])

    if (documentId && ydoc.provider) {
      snapshotDocument(documentId, { force: true }, ydoc.provider.document)
        .then(() => {
          onChange?.(true)
        })
        .catch((ex) => {
          console.error('Error closing assignment:', ex)
          toast.error('Kunde inte spara uppdraget.')
        })
    }
  }

  const handleAbort = () => {
    if (!session) return
    (ydoc.meta.get('core/assignment') as Y.Map<unknown>).delete(session.user.sub)
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
            {assignments.map((assignment, index) => {
              const sub = assignment.__inProgress?.sub
              if (!sub || sub === session?.user.sub) {
                return null
              }
              const user = getAuthorBySub(authors, sub)

              return (
                <div key={assignment.id} className='border-b last:border-0'>
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
                            ydoc.ele,
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
            assignment={getValueByYPath<Y.Map<unknown>>(
              ydoc.meta,
              ['core/assignment', session?.user.sub || ''],
              true
            )?.[0] as Y.Map<unknown>}
            onAbort={handleAbort}
            onClose={handleClose}
            className='mb-6'
          />
        </div>
      )}

      {!!assignments?.length && (
        <div className='border rounded-md'>
          {assignments.map((assignment, index: number) => (
            <div key={`${assignment.id}`} className='border-b last:border-0'>
              {selectedAssignment?.get('id') === assignment.id
                ? (
                    <Assignment
                      ydoc={ydoc}
                      assignment={selectedAssignment}
                      onChange={onChange}
                      onClose={() => setSelectedId(undefined)}
                      className='-my-px -mx-[5px]'
                    />
                  )
                : (
                    <AssignmentRow
                      ydoc={ydoc}
                      index={index}
                      isFocused={index === focusedRowIndex}
                      asDialog={asDialog}
                      onChange={onChange}
                      onSelect={!newAssignment
                        ? () => setSelectedId(assignment.id)
                        : undefined}
                    />
                  )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
