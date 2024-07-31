import { Awareness } from '@/components'
import { ComboBox } from '@/components/ui'
import { useAuthors } from '@/hooks/useAuthors'
import { useYValue } from '@/hooks/useYValue'
import { isYArray } from '@/lib/isType'
import { Block } from '@/protos/service'
import { UserPlus } from '@ttab/elephant-ui/icons'
import { useCallback, useEffect, useRef, useState } from 'react'
import type * as Y from 'yjs'

import { AssigneeAvatars } from '@/components/DataItem/AssigneeAvatars'

interface IAssignee {
  value: string
  label: string
}

export const Assignees = ({ path }: {
  path: string
}): JSX.Element | undefined => {
  const authors = useAuthors({ sort: 'lastName' })
  const [assignees] = useYValue<Y.Array<unknown>>(path, {
    createOnEmpty: {
      path,
      data: []
    }
  })
  const [selectedOptions, setSelectedOptions] = useState<IAssignee[]>([])

  const updateSelectedOptions = useCallback((assignees: Y.Array<unknown>) => {
    setSelectedOptions((assignees?.toJSON() || [])?.map(a => {
      return {
        value: a.uuid,
        label: a.name
      }
    })
    )
  }, [])

  useEffect(() => {
    if (isYArray(assignees)) {
      updateSelectedOptions(assignees)
    }
  }, [updateSelectedOptions, assignees])

  const setFocused = useRef<(value: boolean) => void>(null)
  const placeholder = 'Lägg till uppdragstagare'

  return (
    <div className="flex gap-2">
      <Awareness name='AssignmentAssignees' ref={setFocused}>
        <ComboBox
          size='xs'
          className='w-fit text-muted-foreground font-sans font-normal text-ellipsis px-2 h-7'
          options={authors.map(_ => {
            return {
              value: _.id,
              label: _.title
            }
          })}
          selectedOption={selectedOptions}
          placeholder={placeholder}
          closeOnSelect={false}
          onOpenChange={(isOpen: boolean) => {
            if (setFocused?.current) {
              setFocused.current(isOpen)
            }
          }}
          onSelect={(option) => {
            if (!isYArray(assignees)) {
              return
            }

            const selectedAuthor = selectedOptions.findIndex(sa => sa.value === option.value)
            if (selectedAuthor > -1) {
              assignees.delete(selectedAuthor)
            } else {
              assignees.push([Block.create({
                type: 'core/author',
                uuid: option.value,
                name: option.label,
                rel: 'assignee',
                role: 'primary'
              })])
            }

            updateSelectedOptions(assignees)
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
