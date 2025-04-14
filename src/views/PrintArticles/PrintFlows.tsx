import { usePrintFlows } from '@/hooks/index/usePrintFlows'

export const PrintFlows = (): JSX.Element => {
  const [printFlows] = usePrintFlows({})
  const { fields } = printFlows?.[0] ?? {}
  console.log('usePrintFlows', fields)
  return (
    <>
    <h1 className='text-2xl font-bold'>{fields?.['document.title']?.values?.[0] ?? ''}</h1>
    {fields?.['document.content.tt_print_content.name']?.values?.map(name => <div key={name}>{name}</div>)}
    </>
  )
}
