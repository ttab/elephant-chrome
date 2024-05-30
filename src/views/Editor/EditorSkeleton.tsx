import { Skeleton } from '@ttab/elephant-ui'
import { ViewHeader } from '@/components'
import { PenBoxIcon } from '@ttab/elephant-ui/icons'
import { EditorHeader } from './EditorHeader'

export const EditorSkeleton = (): JSX.Element => {
  return (
    <div>
      <ViewHeader.Root>
        <ViewHeader.Title title='Editor' icon={PenBoxIcon} />
        <ViewHeader.Content>
          <EditorHeader />
        </ViewHeader.Content>
      </ViewHeader.Root>

      <div className='flex flex-col gap-2 h-screen overflow-auto items center pt-4 pl-14 pr-14'>
        <Skeleton className='h-12 w-full' />
        <Skeleton className='h-80 w-full' />

        <div className='flex flex-col gap-1 pt-4'>
          <Skeleton className='h-9 w-full' />
          <Skeleton className='h-9 w-full' />
        </div>

        <div className='flex-grow pt-4'>
          <Skeleton className='h-full w-full overflow-hidden' />
        </div>
      </div>
    </div>)
}
