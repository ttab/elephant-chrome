import { PropsWithChildren } from 'react'
import { Menu } from '@ttab/textbit'

export function ContentMenuGroup({ children }: PropsWithChildren): JSX.Element {
  return (
    <Menu.Group className="flex flex-col p-1 text-md">
      {children}
    </Menu.Group>
  )
}
