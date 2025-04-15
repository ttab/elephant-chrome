import { usePrintFlows } from '@/hooks/index/usePrintFlows'
import { Button } from '@ttab/elephant-ui'

export const PrintFlows = (): JSX.Element => {
  const [printFlows] = usePrintFlows({})
  return (
    <>
      {printFlows?.map((flow) => {
        return (
          <div key={flow.id}>
            <h1 className='text-xl font-bold'>{flow?.fields?.['document.title']?.values?.[0] ?? ''}</h1>
            <div className='text-sm text-gray-500 flex justify-start flex-wrap gap-2'>{flow?.fields?.['document.content.tt_print_content.name']?.values?.join(', ')}</div>
            <Button
              className='mt-2'
              variant='outline'
              onClick={() => {
                window.alert('Ej implementerat')
              }}
            >
              Nytt flöde
            </Button>
          </div>
        )
      })}
    </>
  )
}
