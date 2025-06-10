import { ViewHeader } from '@/components/View'
import { Eye } from '@ttab/elephant-ui/icons'
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
      </ViewHeader.Action>
    </ViewHeader.Root>
  )
}
