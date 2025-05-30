import { useDocuments } from '@/hooks/index/useDocuments'
import { constructQuery, fields } from '@/hooks/baboon/useDocuments/layoutNames'
import { ComboBox } from '@ttab/elephant-ui'
import { Loader } from '@ttab/elephant-ui/icons'
import { useYValue } from '@/hooks/useYValue'
import { cn } from '@ttab/elephant-ui/utils'

export const Layouts = ({ articleLayoutId, basePath, className }: {
  articleLayoutId?: string
  className?: string
  basePath: string
}) => {
  const { data: layouts } = useDocuments({
    documentType: 'tt/print-layout',
    query: constructQuery(articleLayoutId || ''),
    size: 100,
    fields
  })

  const [articleLayoutName, setArticleLayoutName] = useYValue<string>(`${basePath}.name`)

  if (!layouts || !layouts?.length) {
    return <Loader size={16} strokeWidth={1.75} className='animate-spin' />
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
        setArticleLayoutName(option.value)
      }}
    />
  )
}
