import { Skeleton } from '@ttab/elephant-ui'
import { useEffect, useRef, useState, type JSX } from 'react'

const CardSkeleton = () => (
  <div className='flex flex-col gap-2 border bg-white rounded p-2'>
    <div className='flex justify-between'>
      <div className='flex gap-2 items-center'>
        <Skeleton className='h-4 w-4 rounded-full' />
        <Skeleton className='h-4 w-6' />
      </div>
      <Skeleton className='h-4 w-10' />
    </div>

    <div className='flex flex-col gap-1'>
      <Skeleton className='h-4 w-3/4' />
      <Skeleton className='h-3 w-1/3' />
    </div>

    <div className='flex flex-col gap-1'>
      <Skeleton className='h-3 w-1/4' />
      <div className='flex justify-between'>
        <Skeleton className='h-3 w-1/3' />
        <div className='flex gap-2'>
          <Skeleton className='h-4 w-4' />
          <Skeleton className='h-4 w-4' />
        </div>
      </div>
    </div>
  </div>
)

export const ApprovalsSkeleton = ({ count, delay = 300 }: { count: number, delay?: number }): JSX.Element | null => {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    timerRef.current = setTimeout(() => setVisible(true), delay)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [delay])

  if (!visible) {
    return null
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </>
  )
}
