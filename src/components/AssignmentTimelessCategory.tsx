import { Awareness } from '@/components'
import { ComboBox } from '@ttab/elephant-ui'
import { useTimelessCategories } from '@/hooks'
import { useYValue } from '@/modules/yjs/hooks'
import { Block } from '@ttab/elephant-api/newsdoc'
import { useRef, type JSX } from 'react'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
import { useTranslation } from 'react-i18next'

export const AssignmentTimelessCategory = ({ ydoc, assignment, disabled }: {
  ydoc: YDocument<Y.Map<unknown>>
  assignment: Y.Map<unknown>
  disabled?: boolean
}): JSX.Element => {
  const { t } = useTranslation()
  const allCategories = useTimelessCategories().map((_) => {
    return {
      value: _.id,
      label: _.title
    }
  })

  const path = 'links.core/timeless-category'
  const [categories, setCategories] = useYValue<Block[] | undefined>(assignment, path)
  const setFocused = useRef<(value: boolean, start: string) => void>(() => { })
  const selectedOptions = allCategories.filter((category) =>
    categories?.some((cat) => cat.uuid === category.value)
  )

  return (
    <Awareness ydoc={ydoc} ref={setFocused} path={path}>
      <ComboBox
        max={1}
        sortOrder='label'
        size='xs'
        className={disabled ? 'pointer-events-none opacity-60' : ''}
        options={allCategories}
        selectedOptions={selectedOptions}
        placeholder={t('views:timeless.placeholders.addCategory')}
        onOpenChange={(isOpen: boolean) => {
          if (setFocused?.current) {
            setFocused.current(true, (isOpen) ? path : '')
          }
        }}
        onSelect={(option) => {
          if (disabled) return
          if ((categories || [])?.some((c) => c.uuid === option.value)) {
            setCategories(categories?.filter((c: Block) => {
              return c.uuid !== option.value
            }))
          } else {
            setCategories([Block.create({
              type: 'core/timeless-category',
              rel: 'subject',
              uuid: option.value,
              title: option.label
            })])
          }
        }}
        translationStrings={{
          nothingFound: t('common:misc.nothingFound'),
          searching: t('common:misc.searching')
        }}
      />
    </Awareness>
  )
}
