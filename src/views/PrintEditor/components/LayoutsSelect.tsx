import { ComboBox } from '@ttab/elephant-ui'
import { LoaderIcon } from '@ttab/elephant-ui/icons'
import { cn } from '@ttab/elephant-ui/utils'
import type { YDocument } from '@/modules/yjs/hooks'
import { useYValue } from '@/modules/yjs/hooks/useYValue'
import type * as Y from 'yjs'
import type { Document } from '@ttab/elephant-api/newsdoc'

export const LayoutsSelect = ({ ydoc, layout, basePath, onChange, onLayoutSlotChange, className }: {
  ydoc: YDocument<Y.Map<unknown>>
  layout?: Document
  className?: string
  basePath: string
  onChange?: (value: boolean) => void
  onLayoutSlotChange?: (newSlotName: string) => void
}) => {
  const [articleLayoutName, setArticleLayoutName] = useYValue<string>(ydoc.ele, `${basePath}.name`)

  if (!layout) {
    return <LoaderIcon size={16} strokeWidth={1.75} className='animate-spin' />
  }

  const slots = layout.content
    .filter((c) => c.type === 'tt/print-slot')
    .map((c) => c.name)

  const selectedOptions = slots.filter((slot) => slot === articleLayoutName)
    .map((slot) => ({
      label: slot,
      value: slot

    }))

  return (
    <ComboBox
      max={1}
      size='sm'
      sortOrder='label'
      className={cn('justify-start', className)}
      selectedOptions={selectedOptions}
      options={slots.map((l) => ({
        label: l,
        value: l
      }))}
      onSelect={(option) => {
        if (option.value === articleLayoutName) {
          return
        }
        onChange?.(true)
        onLayoutSlotChange?.(option.value)
        setArticleLayoutName(option.value)
      }}
    />
  )
}
