import { Awareness } from '@/components'
import { ComboBox } from '@/components/ui'
import { useRegistry } from '@/hooks'
import { useYValue } from '@/hooks/useYValue'
import { Authors } from '@/lib/index/authors'
import { isYArray } from '@/lib/isType'
import { Block } from '@/protos/service'
import { UserPlus } from '@ttab/elephant-ui/icons'
import { useSession } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'
import type * as Y from 'yjs'


interface IAssignee {
  value: string
  label: string
}

export const Assignees = ({ path }: {
  path: string
}): JSX.Element | undefined => {
  const { server: { indexUrl } } = useRegistry()
  const { data } = useSession()
  const [authors, setAuthors] = useState<IAssignee[]>([])
  const [assignees, setAssignees] = useYValue<Y.Array<unknown>>(path)
  console.log(assignees?.toJSON())
  const setFocused = useRef<(value: boolean) => void>(null)

  const placeholder = 'Lägg till uppdragstagare'

  useEffect(() => {
    async function fetchAuthors(): Promise<void> {
      if (!data?.accessToken || !indexUrl) {
        return
      }

      const result = await Authors.get(new URL(indexUrl), data.accessToken)
      if (Array.isArray(result.hits)) {
        setAuthors(result.hits.map(_ => {
          return {
            value: _._id,
            label: _._source['document.title'][0]
          }
        }))
      }
    }

    void fetchAuthors()
  }, [data?.accessToken, indexUrl])


  // FIXME: ComboBox must be able to have multiple selectedOptions
  // FIXME: All authors must be fetched (now only 100)
  // FIXME: It must be possible to deselect one
  // FIXME: Use <AssigneeAvatars .../> to show assignees selected and not just <UserPlus ...> icon
  // FIXME: Setup correct caching of calls in ServiceWorker
  // FIXME: EventSource should probably be in a WebWorker, not in a Context
  // FIXME: ...

  return (
    <Awareness name='AssignmentAssignees' ref={setFocused}>
      <ComboBox
        size='xs'
        className='w-fit text-muted-foreground font-sans font-normal whitespace-nowrap text-ellipsis px-2 h-7'
        options={authors}
        selectedOption={undefined}
        placeholder={placeholder}
        onOpenChange={(isOpen: boolean) => {
          if (setFocused?.current) {
            setFocused.current(isOpen)
          }
        }}
        onSelect={(option) => {
          const block = Block.create({
            type: 'core/author',
            uuid: option.value,
            name: option.label,
            rel: 'assignee',
            role: 'primary'
          })

          console.log(option)
          console.log(block)
          if (isYArray(assignees)) {
            assignees?.push([block])
          }
        }}
      >
        <UserPlus size={20} strokeWidth={1.75} />
      </ComboBox>
    </Awareness>
  )
}
