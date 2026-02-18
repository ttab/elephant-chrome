import { Awareness } from '@/components'
import { ComboBox } from '@ttab/elephant-ui'
import { useCategories } from '@/hooks'
import { useYValue } from '@/modules/yjs/hooks'
import { Block } from '@ttab/elephant-api/newsdoc'
import { useRef, type JSX } from 'react'
import type { FormProps } from './Form/Root'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
import { useTranslation } from 'react-i18next'

export const Category = ({ ydoc, path, asDialog, onChange }: {
  ydoc: YDocument<Y.Map<unknown>>
  path: string
} & FormProps): JSX.Element => {
  const { t } = useTranslation('event')
  const allCategories = useCategories().map((_) => {
    return {
      value: _.id,
      label: _.title
    }
  })

  const [categories, setCategories] = useYValue<Block[] | undefined>(ydoc.ele, path)
  const setFocused = useRef<(value: boolean, start: string) => void>(() => { })
  const selectedOptions = allCategories.filter((category) =>
    categories?.some((cat) => cat.uuid === category.value)
  )

  return (
    <Awareness ydoc={ydoc} ref={setFocused} path={path}>
      <ComboBox
        max={3}
        sortOrder='label'
        size='xs'
        modal={asDialog}
        options={allCategories}
        selectedOptions={selectedOptions}
        placeholder={t('event:placeholders.addCategory')}
        onOpenChange={(isOpen: boolean) => {
          if (setFocused?.current) {
            setFocused.current(true, (isOpen) ? path : '')
          }
        }}
        onSelect={(option) => {
          onChange?.(true)
          if ((categories || [])?.some((c) => c.uuid === option.value)) {
            setCategories(categories?.filter((c: Block) => {
              return c.uuid !== option.value
            }))
          } else {
            setCategories([...(categories || []), Block.create({
              type: 'core/category',
              rel: 'category',
              uuid: option.value,
              title: option.label
            })])
          }
        }}
        translationStrings={{
          searching: t('common:misc.searching'),
          nothingFound: t('common:misc.nothingFound')
        }}
      />
    </Awareness>
  )
}
