import { useState, useEffect, type JSX } from 'react'
import { View, ViewHeader } from '@/components/View'
import { LoaderCircleIcon } from '@ttab/elephant-ui/icons'
import { Error } from './Error'
import type { ViewProps } from '@/types'

const PENDING_TIMEOUT_MS = 3000

/**
 * Skeleton placeholder shown while waiting for a plugin view to register.
 * After PENDING_TIMEOUT_MS the Error view is rendered instead.
 */
export const PendingView = (props: ViewProps): JSX.Element => {
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => {
      setTimedOut(true)
    }, PENDING_TIMEOUT_MS)

    return () => {
      clearTimeout(id)
    }
  }, [])

  if (timedOut) {
    return <Error {...props} />
  }

  return (
    <View.Root>
      <ViewHeader.Root>
        <ViewHeader.Title
          name='Loading'
          title='Laddar...'
          icon={LoaderCircleIcon}
        />
        <ViewHeader.Content />
        <ViewHeader.Action />
      </ViewHeader.Root>

      <View.Content className='max-w-[800px] p-6'>
        <div className='space-y-4 animate-pulse'>
          <div className='h-8 w-2/3 bg-muted rounded' />
          <div className='h-4 w-full bg-muted rounded' />
          <div className='h-4 w-5/6 bg-muted rounded' />
          <div className='h-32 w-full bg-muted rounded mt-6' />
        </div>
      </View.Content>
    </View.Root>
  )
}
