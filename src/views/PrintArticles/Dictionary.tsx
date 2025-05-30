import { View, ViewHeader } from '@/components/View'
import { type ViewProps } from '@/types/index'
import { BookA } from '@ttab/elephant-ui/icons'
import { cn } from '@ttab/elephant-ui/utils'

const Dictionary = ({ asDialog, onDialogClose, className }: ViewProps): JSX.Element => {
  return (
    <View.Root asDialog={asDialog} className={cn(className, 'min-h-[900px] w-full')}>
      <ViewHeader.Root>
        <ViewHeader.Content>
          {asDialog && (
            <div className='flex w-full h-full items-center space-x-2 font-bold'>
              <ViewHeader.Title name='dictionary' title='Avstämningsordlista' icon={BookA} iconColor='#006bb3' />
            </div>
          )}
        </ViewHeader.Content>
        <ViewHeader.Action onDialogClose={onDialogClose} asDialog={asDialog}>
        </ViewHeader.Action>
      </ViewHeader.Root>
      <View.Content className='p-4 w-full bg-red-500'>
        <div className='min-w-[900px]'>
          <p>This is a placeholder for the Dictionary component.</p>
        </div>
      </View.Content>
    </View.Root>
  )
}

export default Dictionary
