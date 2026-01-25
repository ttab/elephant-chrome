import { Awareness } from '@/components'
import { useStories } from '@/hooks'
import { Block } from '@ttab/elephant-api/newsdoc'
import { ComboBox } from '@ttab/elephant-ui'
import { useRef, type JSX } from 'react'
import type { FormProps } from './Form/Root'
import { type YDocument, useYValue } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
import { useTranslation } from 'react-i18next'

export const Story = ({ ydoc, path, onChange, asSubject }: {
  ydoc: YDocument<Y.Map<unknown>>
  path: string
  asSubject?: boolean
} & FormProps): JSX.Element => {
  const allStories = useStories().map((_) => {
    return {
      value: _.id,
      label: _.title
    }
  })

  const { t } = useTranslation()
  const [story, setStory] = useYValue<Block | undefined>(ydoc.ele, path)
  const setFocused = useRef<(value: boolean, path: string) => void>(() => { })
  const selectedOptions = (allStories || []).filter((s) => s.value === story?.uuid)

  return (
    <Awareness ref={setFocused} ydoc={ydoc} path={path}>
      <ComboBox
        max={1}
        size='xs'
        modal={true}
        sortOrder='label'
        options={allStories}
        selectedOptions={selectedOptions}
        placeholder={story?.title || t('views.planning.story')}
        onOpenChange={(isOpen: boolean) => {
          setFocused.current(true, isOpen ? path : '')
        }}
        onSelect={(option) => {
          onChange?.(true)
          setStory(story?.title === option.label
            ? undefined
            : Block.create({
              type: 'core/story',
              // Workaround for rel differences in the API
              // Article is subject, planning and event are story
              rel: asSubject ? 'subject' : 'story',
              uuid: option.value,
              title: option.label
            }))
        }}
      />
    </Awareness>
  )
}
