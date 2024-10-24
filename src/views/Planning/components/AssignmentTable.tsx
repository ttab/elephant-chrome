import { PlusIcon } from '@ttab/elephant-ui/icons'
import { AssignmentRow } from './AssignmentRow'
import { appendAssignment } from '@/lib/createYItem'
import { useCollaboration, useYValue } from '@/hooks'
import { Assignment } from './Assignment'
import { type Block } from '@ttab/elephant-api/newsdoc'
import { useMemo, useState } from 'react'
import { deleteByYPath } from '@/lib/yUtils'
import { cn } from '@ttab/elephant-ui/utils'
import { type EleBlock } from '@/shared/types'

export const AssignmentTable = (): JSX.Element => {
  const { provider } = useCollaboration()
  const [assignments] = useYValue<EleBlock[]>('meta.core/assignment')
  const [planningSlugLine] = useYValue<string | undefined>('meta.tt/slugline[0].value')
  const [selectedAssignment, setSelectedAssignment] = useState<number | undefined>(undefined)

  const newAssigment = useMemo(() => {
    const index = assignments?.findIndex(a => a.__inProgress) ?? -1
    return (index < 0) ? undefined : { assignment: assignments?.[index], index }
  }, [assignments])

  const existingAssigments = useMemo(() => {
    return assignments?.filter(a => !a.__inProgress) ?? []
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


  return (
    <>
      {newAssigment === undefined && provider?.document &&
        <div className={cn('flex flex-start pt-2 text-primary pb-4',
          selectedAssignment != null ? 'opacity-50' : '')}>
          <div className='pl-6'>
            <a href='#'
              className={cn('flex flex-start items-center text-sm gap-2 p-2 -ml-2 rounded-sm',
                selectedAssignment != null
                  ? 'hover:cursor-default opacity-50'
                  : 'hover:bg-muted')}
              onClick={(evt) => {
                evt.preventDefault()
                if (selectedAssignment != null) {
                  return
                }

                appendAssignment({
                  document: provider.document,
                  inProgress: true,
                  slugLine: (!slugLines?.includes(planningSlugLine || ''))
                    ? planningSlugLine
                    : undefined
                })
              }}
          >
              <div className='bg-primary rounded-full w-5 h-5 relative'>
                <PlusIcon
                  size={15}
                  strokeWidth={2.25}
                  color='#FFFFFF'
                  className='absolute inset-0 m-auto'
              />
              </div>
              Lägg till uppdrag
            </a>
          </div>
        </div>
      }

      {!!newAssigment &&
      <Assignment
        index={newAssigment.index}
        onAbort={() => {
          deleteByYPath(yRoot, `meta.core/assignment[${newAssigment.index}]`)
        }}
        onClose={() => {
          deleteByYPath(yRoot, `meta.core/assignment[${newAssigment.index}].__inProgress`)
        }}
        className='mb-6'
          />
      }

      {!!existingAssigments.length &&
        <div className='border rounded-md'>
          {existingAssigments?.map((_, index: number) => (
            <div key={`${_.id}`} className='border-b last:border-0'>
              {selectedAssignment === index
                ? <Assignment index={index} onClose={() => {
                  setSelectedAssignment(undefined)
                }} className='-my-[1px] -mx-[5px]' />
                : <AssignmentRow index={index} onSelect={() => {
                  if (!newAssigment) {
                    setSelectedAssignment(index)
                  }
                }} />
              }
            </div>
          ))}
        </div>
      }
    </>
  )
}
