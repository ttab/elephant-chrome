import { ViewHeader } from '@/components/View'
import { Button } from '@ttab/elephant-ui'

import { Eye, RefreshCw } from '@ttab/elephant-ui/icons'

export const PreviewHeader = (): JSX.Element => {
  return (
    <ViewHeader.Root className='flex flex-row justify-between items-center'>
      <ViewHeader.Title name='Förhandsvisning' title='Förhandsvisning' icon={Eye} />
      <ViewHeader.Action>
        <div className='flex flex-row gap-2 items-center justify-end'>
          <Button
            variant='outline'
            className='p-2 flex gap-2 items-center'
            onClick={() => {
              window.alert('Ej implementerat')
            }}
          >
            <RefreshCw strokeWidth={1.75} size={18} />
            Uppdatera
          </Button>
        </div>
      </ViewHeader.Action>
    </ViewHeader.Root>
  )
}
