import { type JSX } from 'react'
import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@ttab/elephant-ui'
import { Block } from '@ttab/elephant-api/newsdoc'
import { useTimelessCategories } from '@/hooks'
import { useTranslation } from 'react-i18next'

/**
 * Subject-category picker for timeless articles. The schema requires exactly
 * one `core/timeless-category` link with `rel='subject'`, so any creation
 * flow for a timeless article needs this before it can save.
 */
export const TimelessCategorySelect = ({ value, onChange }: {
  value?: Block
  onChange: (category: Block) => void
}): JSX.Element => {
  const { t } = useTranslation()
  const allCategories = useTimelessCategories().map((cat) => ({
    value: cat.id,
    label: cat.title
  }))

  return (
    <div className='flex flex-col gap-2'>
      <Label className='text-sm text-muted-foreground'>
        {t('views:timeless.columnLabels.category')}
      </Label>
      <Select
        value={value?.uuid ?? ''}
        onValueChange={(selected) => {
          const cat = allCategories.find((c) => c.value === selected)
          if (cat) {
            onChange(Block.create({
              type: 'core/timeless-category',
              rel: 'subject',
              uuid: cat.value,
              title: cat.label
            }))
          }
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder={t('views:timeless.placeholders.addCategory')} />
        </SelectTrigger>
        <SelectContent>
          {allCategories.map((cat) => (
            <SelectItem key={cat.value} value={cat.value}>
              {cat.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
