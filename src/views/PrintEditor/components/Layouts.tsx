import { useDocuments } from '@/hooks/index/useDocuments'
import { constructQuery, fields } from '@/hooks/baboon/useDocuments/layoutNames'
import { ComboBox } from '@ttab/elephant-ui'
import { LoaderIcon } from '@ttab/elephant-ui/icons'
import { useYValue } from '@/hooks/useYValue'
import { cn } from '@ttab/elephant-ui/utils'

export const Layouts = ({ articleLayoutId, basePath, onChange, className }: {
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

  const [articleLayoutName, setArticleLayoutName] = useYValue<string>(`${basePath}.name`)

  if (!layouts || !layouts?.result.length) {
    return <LoaderIcon size={16} strokeWidth={1.75} className='animate-spin' />
  }

  const slots = layouts.result[0].fields['document.content.tt_print_slot.name'].values
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
      options={layouts.result[0].fields['document.content.tt_print_slot.name'].values
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
