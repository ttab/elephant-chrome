import { Awareness } from '@/components'
import { ComboBox } from '@ttab/elephant-ui'
import { useAuthors } from '@/hooks/useAuthors'
import { useYValue } from '@/hooks/useYValue'
import { Block } from '@ttab/elephant-api/newsdoc'
import { UserPlus } from '@ttab/elephant-ui/icons'
import { useRef } from 'react'

import { AssigneeAvatars } from '@/components/DataItem/AssigneeAvatars'

export const Assignees = ({ path }: {
  path: string
}): JSX.Element | undefined => {
  const allAuthors = useAuthors().map((_) => {
    return {
      value: _.id,
      label: _.title
    }
  })

  const [assignees, setAssignees] = useYValue<Block[]>(path)

  const selectedOptions = ((assignees || [])?.map(a => {
    return {
      value: a.uuid,
      label: a.name
    }
  }))

  const setFocused = useRef<(value: boolean) => void>(null)
  const placeholder = 'Lägg till uppdragstagare'

  return (
    <div className="flex gap-2 items-center">
      <Awareness name='AssignmentAssignees' ref={setFocused}>
        <ComboBox
          variant={'ghost'}
          size='xs'
          options={allAuthors}
          selectedOptions={selectedOptions}
          placeholder={placeholder}
          closeOnSelect={false}
          onOpenChange={(isOpen: boolean) => {
            if (setFocused?.current) {
              setFocused.current(isOpen)
            }
          }}
          onSelect={(option) => {
            const selectedAuthor = selectedOptions.findIndex(sa => sa.value === option.value)

            if (selectedAuthor > -1) {
              setAssignees((assignees || []).filter(a => a.uuid !== option.value))
            } else {
              setAssignees([...(assignees || []), Block.create({
                type: 'core/author',
                uuid: option.value,
                name: option.label,
                rel: 'assignee',
                role: 'primary'
              })
              ])
            }
          }}
        >
          <UserPlus size={20} strokeWidth={1.75} />
        </ComboBox>
      </Awareness>

      <div className="opacity-80 cursor-default">
        <AssigneeAvatars
          assignees={selectedOptions.map((author) => author.label)}
          size='xs'
        />
      </div>
    </div>
  )
}
