import { type PropsWithChildren } from 'react'

interface AvatarGroupProps extends PropsWithChildren {}

export function AvatarGroup({ children }: AvatarGroupProps): JSX.Element {
  return (
    <div className='flex -space-x-2 items-center'>
      {children}
    </div>
  )
}
