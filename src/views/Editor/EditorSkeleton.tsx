import { Skeleton } from '@ttab/elephant-ui'
import type { JSX } from 'react'
import { View } from '@/components'

export const EditorSkeleton = (): JSX.Element => (
  <View.Root>
    <div className='flex items-center justify-between px-4 py-2 border-b shrink-0'>
      <Skeleton className='h-7 w-48' />
      <div className='flex gap-2'>
        <Skeleton className='h-7 w-20' />
        <Skeleton className='h-7 w-20' />
      </div>
    </div>
    <View.Content className='flex flex-col max-w-[1000px]' variant='grid'>
      <div className='px-12 pt-8 flex flex-col gap-3'>
        <Skeleton className='h-8 w-1/2' />
        <div className='flex flex-col gap-2 mt-2'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-5/6' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-4/5' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-3/4' />
        </div>
      </div>
    </View.Content>
  </View.Root>
)
