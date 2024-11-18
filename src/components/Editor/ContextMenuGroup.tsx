import { type PropsWithChildren } from 'react'
import { Menu } from '@ttab/textbit'

export const ContextMenuGroup = ({ children }: PropsWithChildren): JSX.Element => {
  return (
    <Menu.Group className='flex flex-col p-1 text-md'>
      {!!children && <>{children}</>}
    </Menu.Group>
  )
}
