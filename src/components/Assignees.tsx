import { Awareness } from '@/components'
import { ComboBox } from '@ttab/elephant-ui'
import { useAuthors } from '@/hooks/useAuthors'
import { UserPlusIcon } from '@ttab/elephant-ui/icons'
import { useRef, type JSX } from 'react'

import { AssigneeAvatars } from '@/components/DataItem/AssigneeAvatars'
import { YBlock } from '@/shared/YBlock'
import type { EleBlock } from '@/shared/types'
import { type FormProps } from './Form/Root'
import { type YDocument, useYValue } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
import { useTranslation } from 'react-i18next'

export const Assignees = ({ ydoc, path, rootMap, placeholder, asDialog, onChange }: {
  ydoc: YDocument<Y.Map<unknown>>
  rootMap?: Y.Map<unknown>
  placeholder: string
  path: string
} & FormProps): JSX.Element | undefined => {
  const { t } = useTranslation('common')
  const allAuthors = useAuthors().map((_) => {
    return {
      value: _.id,
      label: _.name
    }
  })
  const [assignees, setAssignees] = useYValue<EleBlock[]>(rootMap || ydoc.ele, path)
  const selectedOptions = ((assignees || [])?.map((a) => {
    return {
      value: a.uuid,
      label: a.title
    }
  }))
  const setFocused = useRef<(value: boolean, path: string) => void>(() => { })

  return (
    <div className='flex gap-2 items-center'>
      <Awareness ydoc={ydoc} ref={setFocused} path={path}>
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
            onChange?.(true)

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
          translationStrings={{
            nothingFound: t('misc.nothingFound'),
            searching: t('misc.searching')
          }}
        >
          <UserPlusIcon size={20} strokeWidth={1.75} />
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
