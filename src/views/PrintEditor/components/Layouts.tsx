import { useDocuments } from '@/hooks/index/useDocuments'
import { constructQuery, fields } from '@/hooks/baboon/useDocuments/layoutNames'
import { ComboBox } from '@ttab/elephant-ui'
import { LoaderIcon } from '@ttab/elephant-ui/icons'
import { cn } from '@ttab/elephant-ui/utils'
import type { YDocument } from '@/modules/yjs/hooks'
import { useYValue } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'

export const Layouts = ({ ydoc, articleLayoutId, basePath, onChange, className }: {
  ydoc: YDocument<Y.Map<unknown>>
  articleLayoutId?: string
  className?: string
  basePath: string
  onChange?: (value: boolean) => void
}) => {
  const { data: layouts } = useDocuments({
    documentType: 'tt/print-layout',
    query: constructQuery(articleLayoutId || ''),
    size: 100,
    fields
  })

  const [articleLayoutName, setArticleLayoutName] = useYValue<string>(ydoc.ele, `${basePath}.name`)

  if (!layouts || !layouts?.length) {
    return <LoaderIcon size={16} strokeWidth={1.75} className='animate-spin' />
  }

  const slots = layouts[0].fields['document.content.tt_print_slot.name'].values
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
      options={layouts[0].fields['document.content.tt_print_slot.name'].values
        .map((l) => ({
          label: l,
          value: l
        }))}
      onSelect={(option) => {
        onChange?.(true)
        setArticleLayoutName(option.value)
      }}
    />
  )
}
