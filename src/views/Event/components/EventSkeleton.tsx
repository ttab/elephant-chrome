import { Skeleton } from '@ttab/elephant-ui'
import type { JSX } from 'react'

export const EventSkeleton = (): JSX.Element => (
  <div className='flex flex-col gap-4 px-10 pt-4'>
    <Skeleton className='h-9 w-3/4 mt-2' />
    <Skeleton className='h-12 w-full' />
    <Skeleton className='h-12 w-full' />
    <div className='flex gap-2 items-center pt-2'>
      <Skeleton className='h-4 w-4 shrink-0' />
      <Skeleton className='h-8 w-36' />
      <Skeleton className='h-8 w-24' />
    </div>
    <div className='flex gap-2 items-center'>
      <Skeleton className='h-4 w-4 shrink-0' />
      <Skeleton className='h-8 w-36' />
      <Skeleton className='h-8 w-36' />
    </div>
    <div className='flex gap-2 items-center'>
      <Skeleton className='h-4 w-4 shrink-0' />
      <Skeleton className='h-8 w-36' />
      <Skeleton className='h-8 w-32' />
    </div>
  </div>
)
