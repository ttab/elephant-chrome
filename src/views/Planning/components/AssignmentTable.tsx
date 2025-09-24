import { InfoIcon, PlusIcon } from '@ttab/elephant-ui/icons'
import { AssignmentRow } from './AssignmentRow'
import { appendAssignment } from '@/shared/createYItem'
import { useAuthors, useCollaboration, useNavigationKeys, useYValue } from '@/hooks'
import { Assignment } from './Assignment'
import { type Block } from '@ttab/elephant-api/newsdoc'
import type { MouseEvent, KeyboardEvent } from 'react'
import { useMemo, useState } from 'react'
import { deleteByYPath, getValueByYPath } from '@/shared/yUtils'
import { type EleBlock } from '@/shared/types'
import { cva } from 'class-variance-authority'
import { Button } from '@ttab/elephant-ui'
import { useActiveAuthor } from '@/hooks/useActiveAuthor'
import { snapshotDocument } from '@/lib/snapshotDocument'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { getAuthorBySub } from '@/lib/getAuthorBySub'

export const AssignmentTable = ({ asDialog = false, documentId, onChange }: {
  asDialog?: boolean
  documentId?: string
  onChange?: (arg: boolean) => void
}): JSX.Element => {
  const { provider } = useCollaboration()
  const [assignments] = useYValue<EleBlock[]>('meta.core/assignment')
  const [planningSlugLine] = useYValue<string | undefined>('meta.tt/slugline[0].value')
  const [selectedAssignment, setSelectedAssignment] = useState<number | undefined>(undefined)
  const [focusedRowIndex, setFocusedRowIndex] = useState<number | undefined>()
  const author = useActiveAuthor({ full: false })
  const { data: session } = useSession()
  const authors = useAuthors()

  const newAssigment = useMemo(() => {
    const index = assignments?.findIndex((a) => a.__inProgress) ?? -1
    return (index < 0) ? undefined : { assignment: assignments?.[index], index }
  }, [assignments])

  const existingAssigments = useMemo(() => {
    return assignments?.filter((a) => !a.__inProgress) ?? []
  }, [assignments])

  const slugLines = useMemo(() => {
    return (assignments || []).reduce<string[]>((acc, item) => {
      const slugline = (item.meta as unknown as Record<string, Block[]>)?.['tt/slugline']?.[0]?.value
      return (slugline) ? [...acc, slugline] : acc
    }, [])
  }, [assignments])

  const yRoot = useMemo(() => {
    return provider?.document.getMap('ele')
  }, [provider?.document])

  const handleNewAssignment = (event: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (selectedAssignment != null || !provider?.document) {
      return
    }

    appendAssignment({
      document: provider.document,
      inProgress: {
        sub: session?.user.sub ?? ''
      },
      assignee: author,
      slugLine: (!slugLines?.includes(planningSlugLine || ''))
        ? planningSlugLine
        : undefined,
      type: 'text'
    })
  }

  const handleClose = async () => {
    const currentAssigmentPath = `meta.core/assignment[${newAssigment?.index}]`

    // Since we're transfering the slugline to new text assignments, we need to clean up
    const [assignmentType] = getValueByYPath(yRoot,
      `${currentAssigmentPath}.meta.core/assignment-type[0].value`)

    if (assignmentType !== 'text' && assignmentType !== 'editorial-info') {
      deleteByYPath(yRoot, `${currentAssigmentPath}.meta.[tt/slugline]`)
    }

    deleteByYPath(yRoot, `${currentAssigmentPath}.__inProgress`)

    if (documentId) {
      await snapshotDocument(documentId, {
        force: true
      }, provider?.document)
    }

    // Set document as changed once we close the new assignment
    onChange?.(true)
  }

  useNavigationKeys({
    keys: ['ArrowUp', 'ArrowDown'],
    onNavigation: (event) => {
      const idx = (focusedRowIndex === undefined)
        ? (event.key === 'ArrowDown' ? 0 : existingAssigments.length - 1)
        : (focusedRowIndex + (event.key === 'ArrowDown' ? 1 : -1) + existingAssigments.length) % existingAssigments.length
      setFocusedRowIndex(idx)
    }
  })

  const variants = cva('',
    {
      variants: {
        asDialog: {
          false: 'pl-6',
          true: 'pl-2'
        }
      }
    })

  return (
    <>
      <div className='flex flex-start pt-2 text-primary pb-4 items-center'>
        <div className={variants({ asDialog })}>
          <Button
            disabled={newAssigment !== undefined || !provider?.document}
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

        {!!newAssigment && session?.user.sub !== newAssigment.assignment?.__inProgress?.sub
          && (
            <div className='text-sm ps-1 flex flex-row gap-1 text-muted-foreground items-center'>
              <InfoIcon size={18} strokeWidth={1.75} />
              <div>
                <span className='hidden sm:inline'>Nytt uppdrag skapas av</span>
                {' '}
                {getAuthorBySub(authors, newAssigment.assignment?.__inProgress?.sub)?.name || `okänd: ${newAssigment.assignment?.__inProgress?.sub ?? 'användare'}`}
              </div>
            </div>
          )}
      </div>

      {!!newAssigment && session?.user.sub === newAssigment.assignment?.__inProgress?.sub && (
        <div className='pb-6'>
          <Assignment
            index={newAssigment.index}
            onAbort={() => {
              deleteByYPath(yRoot, `meta.core/assignment[${newAssigment.index}]`)
            }}
            onClose={() => {
              handleClose().catch((ex) => {
                console.error('Error closing assignment:', ex)
                toast.error('Kunde inte spara uppdraget.')
              })
            }}
            className='mb-6'
          />
        </div>
      )}

      {!!existingAssigments.length && (
        <div className='border rounded-md'>
          {existingAssigments?.map((_, index: number) => (
            <div key={`${_.id}`} className='border-b last:border-0'>
              {selectedAssignment === index
                ? (
                    <Assignment
                      onChange={onChange}
                      index={index}
                      onClose={() => {
                        setSelectedAssignment(undefined)
                      }}
                      className='-my-px -mx-[5px]'
                    />
                  )
                : (
                    <AssignmentRow
                      index={index}
                      isFocused={index === focusedRowIndex}
                      asDialog={asDialog}
                      onChange={onChange}
                      onSelect={() => {
                        if (!newAssigment) {
                          setSelectedAssignment(index)
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
