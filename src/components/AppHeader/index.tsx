import { Menu } from './Menu'
import { Avatar } from './Avatar'

export const AppHeader = (): JSX.Element => {
  return (
    <header className='justify-end flex border-b pb-[11px] h-max'>
      <Avatar />
      <Menu />
    </header>
  )
}
