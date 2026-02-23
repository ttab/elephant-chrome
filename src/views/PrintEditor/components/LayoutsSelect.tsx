import { ComboBox } from '@ttab/elephant-ui'
import { LoaderIcon } from '@ttab/elephant-ui/icons'
import { cn } from '@ttab/elephant-ui/utils'
import type { YDocument } from '@/modules/yjs/hooks'
import { useYValue } from '@/modules/yjs/hooks/useYValue'
import type * as Y from 'yjs'
import type { Document } from '@ttab/elephant-api/newsdoc'
import { useTranslation } from 'react-i18next'

export const LayoutsSelect = ({ ydoc, layout, basePath, onChange, className }: {
  ydoc: YDocument<Y.Map<unknown>>
  layout?: Document
  className?: string
  basePath: string
  onChange?: (value: boolean) => void
}) => {
  const [articleLayoutName, setArticleLayoutName] = useYValue<string>(ydoc.ele, `${basePath}.name`)
  const { t } = useTranslation()

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
        onChange?.(true)
        setArticleLayoutName(option.value)
      }}
      translationStrings={{
        nothingFound: t('misc.nothingFound'),
        searching: t('misc.searching')
      }}
    />
  )
}
