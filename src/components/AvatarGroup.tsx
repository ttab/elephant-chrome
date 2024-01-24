import { type PropsWithChildren } from 'react'

export function AvatarGroup({ children }: PropsWithChildren): JSX.Element {
  return (
    <div className='flex -space-x-2 items-center'>
      {children}
    </div>
  )
}
