import { ViewHeader } from '@/components/View'
import { Button } from '@ttab/elephant-ui'

import { Eye, RefreshCw } from '@ttab/elephant-ui/icons'
/**
 * PreviewHeader component.
 *
 * This component renders the header for the PrintPreview view. It includes a title
 * and an action button. The title is displayed with an icon, and the action button
 * currently triggers an alert when clicked.
 *
 * @returns The rendered PreviewHeader component.
 *
 * @remarks
 * The component uses the `ViewHeader` component to structure the header layout.
 * The action button is styled with an outline variant and includes an icon for
 * refreshing the view. The button's functionality is not yet implemented.
 */


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
