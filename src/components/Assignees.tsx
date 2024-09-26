import { Awareness } from '@/components'
import { ComboBox } from '@/components/ui'
import { useAuthors } from '@/hooks/useAuthors'
import { useYValue } from '@/hooks/useYValue'
import { UserPlus } from '@ttab/elephant-ui/icons'
import { useRef } from 'react'

import { AssigneeAvatars } from '@/components/DataItem/AssigneeAvatars'
import { YBlock } from '@/shared/YBlock'
import type { EleBlock } from '@/shared/types'

export const Assignees = ({ path, name, placeholder }: {
  name: string
  placeholder: string
  path: string
}): JSX.Element | undefined => {
  const allAuthors = useAuthors().map((_) => {
    return {
      value: _.id,
      label: _.name
    }
  })
  const [assignees, setAssignees] = useYValue<EleBlock[]>(path)
  const selectedOptions = ((assignees || [])?.map(a => {
    return {
      value: a.uuid,
      label: a.name
    }
  }))
  const setFocused = useRef<(value: boolean) => void>(null)

  return (
    <div className="flex gap-2 items-center">
      <Awareness name={name} ref={setFocused}>
        <ComboBox
          size='xs'
          className='w-fit text-muted-foreground font-sans font-normal text-ellipsis px-2 h-7'
          options={allAuthors}
          selectedOption={selectedOptions}
          placeholder={placeholder}
          closeOnSelect={false}
          onOpenChange={(isOpen: boolean) => {
            if (setFocused?.current) {
              setFocused.current(isOpen)
            }
          }}
          onSelect={(option) => {
            const selectedAssignee = selectedOptions.findIndex(sa => sa.value === option.value)

            if (selectedAssignee > -1) {
              setAssignees((assignees || []).filter(a => a.uuid !== option.value))
            } else {
              setAssignees([...(assignees || []), YBlock.create({
                type: 'core/author',
                uuid: option.value,
                name: option.label,
                rel: 'assignee',
                role: 'primary'
              })[0]
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
