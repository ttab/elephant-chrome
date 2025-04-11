import { Awareness } from '@/components'
import { ComboBox } from '@ttab/elephant-ui'
import { useAuthors } from '@/hooks/useAuthors'
import { useYValue } from '@/hooks/useYValue'
import { UserPlus } from '@ttab/elephant-ui/icons'
import { useRef } from 'react'

import { AssigneeAvatars } from '@/components/DataItem/AssigneeAvatars'
import { YBlock } from '@/shared/YBlock'
import type { EleBlock } from '@/shared/types'
import { type FormProps } from './Form/Root'

export const Assignees = ({ path, placeholder, asDialog }: {
  placeholder: string
  path: string
} & FormProps): JSX.Element | undefined => {
  const allAuthors = useAuthors().map((_) => {
    return {
      value: _.id,
      label: _.name
    }
  })
  const [assignees, setAssignees] = useYValue<EleBlock[]>(path)
  const selectedOptions = ((assignees || [])?.map((a) => {
    return {
      value: a.uuid,
      label: a.title
    }
  }))
  const setFocused = useRef<(value: boolean, path: string) => void>(() => { })

  return (
    <div className='flex gap-2 items-center'>
      <Awareness ref={setFocused} path={path}>
        <ComboBox
          variant='ghost'
          size='xs'
          options={allAuthors}
          selectedOptions={selectedOptions}
          placeholder={placeholder}
          closeOnSelect={false}
          modal={asDialog}
          onOpenChange={(isOpen: boolean) => {
            setFocused.current(true, isOpen ? path : '')
          }}
          onSelect={(option) => {
            const selectedAssignee = selectedOptions.findIndex((sa) => sa.value === option.value)

            if (selectedAssignee > -1) {
              setAssignees((assignees || []).filter((a) => a.uuid !== option.value))
            } else {
              setAssignees([...(assignees || []), YBlock.create({
                type: 'core/author',
                uuid: option.value,
                title: option.label,
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

      <div className='cursor-default'>
        <AssigneeAvatars
          assignees={selectedOptions.map((author) => author.label)}
          size='xs'
        />
      </div>
    </div>
  )
}
