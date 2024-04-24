import { useYObserver } from '@/hooks/useYObserver'
import { PlusIcon } from '@ttab/elephant-ui/icons'
import { AssignmentRow } from './AssignmentRow'
import { createPlanningAssignment } from '@/lib/planning/createPlanningAssignment'
import { useCollaboration } from '@/hooks'
import { Assignment } from './Assignment'
import { useState } from 'react'


export const AssignmentTable = ({ documentId }: {
  documentId: string
}): JSX.Element => {
  const { provider } = useCollaboration()
  const { state } = useYObserver('meta', 'core/assignment')
  const [selectedAssignment, setSelectedAssignment] = useState<number | undefined>(undefined)
  const [createdAssignment, setCreatedAssignment] = useState<number | undefined>(undefined)
  const noOfAssignments = !Array.isArray(state) ? 0 : state.length

  return (
    <div className='flex flex-col gap-2 pt-4'>
      <div className='flex flex-start'>
        <a href="#" className='flex flex-start items-center text-sm gap-2 p-2 -ml-2 rounded-sm hover:bg-gray-100' onClick={(evt) => {
          evt.preventDefault()

          if (provider?.document) {
            createPlanningAssignment(provider?.document)
            setCreatedAssignment(noOfAssignments)
          }
        }}
        >
          <div className='bg-green-400 rounded-full text-white w-5 h-5 flex justify-center items-center'>
            <PlusIcon size={14} strokeWidth={1.75} className='rounded-full' />
          </div>
          Lägg till uppdrag
        </a>
      </div>

      {createdAssignment !== undefined &&
        <Assignment index={createdAssignment} setSelectedAssignment={setCreatedAssignment} />
      }

      <div className="border-t">
        {Array.isArray(state) && state.map((_, index: number) => (
          <>
            {selectedAssignment === index
              ? <Assignment index={index} setSelectedAssignment={setSelectedAssignment} />
              : < AssignmentRow key={index} index={index} setSelectedAssignment={setSelectedAssignment} />
            }
          </>
        ))}
      </div>
    </div >
  )
}
