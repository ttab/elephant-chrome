import { PlusIcon } from '@ttab/elephant-ui/icons'
import { AssignmentRow } from './AssignmentRow'
import { appendAssignment } from '@/lib/createYItem'
import { useCollaboration, useYObserver } from '@/hooks'
import { Assignment } from './Assignment'
import { useEffect, useState } from 'react'


export const AssignmentTable = (): JSX.Element => {
  const { provider } = useCollaboration()
  const { state } = useYObserver('meta', 'core/assignment')
  const noOfAssignments = !Array.isArray(state) ? 0 : state.length
  const [createdAssignment, setCreatedAssignment] = useState<number | undefined>(undefined)
  const [selectedAssignment, setSelectedAssignment] = useState<number | undefined>(undefined)

  useEffect(() => {
    // @ts-expect-error FIXME: Remove this line when __inProgress is part of the format
    const assignmentInProgress = Array.isArray(state) ? state.findIndex(a => a.__inProgress) : -1
    setCreatedAssignment(assignmentInProgress < 0 ? undefined : assignmentInProgress)
  }, [setCreatedAssignment, state])

  return (
    <div className='flex flex-col gap-2 pt-4'>
      {createdAssignment === undefined &&
        <div className='flex flex-start pb-2'>
          <a href="#" className='flex flex-start items-center text-sm gap-2 p-2 -ml-2 rounded-sm hover:bg-gray-100' onClick={(evt) => {
            evt.preventDefault()

            if (provider?.document) {
              appendAssignment({ document: provider?.document, inProgress: true })
              setCreatedAssignment(noOfAssignments)
            }
          }}
          >
            <div className='bg-primary rounded-full text-white w-5 h-5 flex justify-center items-center'>
              <PlusIcon size={14} strokeWidth={1.75} className='rounded-full' />
            </div>
            Lägg till uppdrag
          </a>
        </div>
      }

      {createdAssignment !== undefined &&
        <Assignment
          index={createdAssignment}
          setSelectedAssignment={setCreatedAssignment}
          className='mb-6'
        />
      }

      {/* @ts-expect-error FIXME: Remove this line when __inProgress is part of the format */}
      {Array.isArray(state) && !!state.filter(a => !a.__inProgress).length &&
        <div className="divide-y border-y">
          {/* @ts-expect-error FIXME: Remove this line when __inProgress is part of the format */}
          {Array.isArray(state) && state.filter(a => !a.__inProgress).map((_, index: number) => (
            <div key={`${_.id}`}>
              {selectedAssignment === index
                ? <Assignment index={index} setSelectedAssignment={setSelectedAssignment} className='my-6' />
                : <AssignmentRow index={index} setSelectedAssignment={setSelectedAssignment} />
              }
            </div>
          ))}
        </div>
      }
    </div >
  )
}
