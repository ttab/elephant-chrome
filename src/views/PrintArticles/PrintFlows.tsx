import { useFetchPrintFlows } from '@/hooks/baboon/useFetchPrintFlows'
import { useRegistry } from '@/hooks/useRegistry'
import { Button } from '@ttab/elephant-ui'
import { useSession } from 'next-auth/react'

/**
 * PrintFlows component.
 *
 * This component fetches and displays a list of print flows. It uses the `useFetchPrintFlows` hook
 * to retrieve the data from the server and displays each flow with its title and content names.
 * A button is provided for each flow, but its functionality is not yet implemented.
 *
 * @returns The rendered PrintFlows component.
 *
 * @remarks
 * The component handles errors by logging them to the console. It requires a valid session
 * and registry to fetch the print flows data.
 */


export const PrintFlows = (): JSX.Element => {
  const { data: session } = useSession()
  const { server: { indexUrl } } = useRegistry()
  const { data, error } = useFetchPrintFlows(indexUrl, session)

  if (error) {
    console.error('Could not fetch PrintFlows:', error)
  }

  return (
    <>
      {data?.hits?.map((flow) => {
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
