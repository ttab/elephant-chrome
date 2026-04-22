import { Awareness } from '@/components'
import { ComboBox } from '@ttab/elephant-ui'
import { useTimelessCategories } from '@/hooks'
import { useYValue } from '@/modules/yjs/hooks'
import { Block } from '@ttab/elephant-api/newsdoc'
import { useRef, type JSX } from 'react'
import type { FormProps } from './Form/Root'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
import { useTranslation } from 'react-i18next'

interface PickerProps {
  value: Block | undefined
  onChange: (category: Block | undefined) => void
  asDialog?: boolean
  validation?: boolean
}

export const CategoryPicker = ({ value, onChange, asDialog, validation }: PickerProps): JSX.Element => {
  const { t } = useTranslation()
  const allCategories = useTimelessCategories().map((_) => ({
    value: _.id,
    label: _.title
  }))
  const selectedOptions = value
    ? allCategories.filter((c) => c.value === value.uuid)
    : []

  return (
    <ComboBox
      max={1}
      sortOrder='label'
      size='xs'
      modal={asDialog}
      variant='outline'
      validation={validation}
      options={allCategories}
      selectedOptions={selectedOptions}
      placeholder={t('views:timeless.placeholders.addCategory')}
      onSelect={(option) => {
        if (value?.uuid === option.value) {
          onChange(undefined)
          return
        }
        onChange(Block.create({
          type: 'core/timeless-category',
          rel: 'subject',
          uuid: option.value,
          title: option.label
        }))
      }}
      translationStrings={{
        nothingFound: t('common:misc.nothingFound'),
        searching: t('common:misc.searching')
      }}
    />
  )
}

/**
 * Yjs-bound timeless category picker — reads/writes
 * `links.core/timeless-category` and announces awareness on focus.
 */
export const TimelessCategory = ({ ydoc, path, asDialog, onChange }: {
  ydoc: YDocument<Y.Map<unknown>>
  path: string
} & FormProps): JSX.Element => {
  const [categories, setCategories] = useYValue<Block[] | undefined>(ydoc.ele, path)
  const setFocused = useRef<(value: boolean, start: string) => void>(() => { })

  return (
    <Awareness ydoc={ydoc} ref={setFocused} path={path}>
      <CategoryPicker
        value={categories?.[0]}
        asDialog={asDialog}
        onChange={(block) => {
          onChange?.(true)
          setCategories(block ? [block] : undefined)
        }}
      />
    </Awareness>
  )
}

/**
 * Controlled variant for non-Yjs forms (e.g. pre-save creation prompts). The
 * schema requires exactly one `core/timeless-category` link with
 * `rel='subject'`, so any creation flow for a timeless article needs this
 * before it can save.
 */
export const TimelessCategorySelect = ({ value, onChange }: {
  value: Block | undefined
  onChange: (category: Block) => void
}): JSX.Element => (
  <div className='flex flex-col gap-2'>
    <CategoryPicker
      value={value}
      onChange={(block) => {
        if (block) {
          onChange(block)
        }
      }}
    />
  </div>
)
