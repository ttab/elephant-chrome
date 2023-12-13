import { Menu } from './Menu'
import { Avatar } from './Avatar'

export const AppHeader = (): JSX.Element => {
  return (
    <header className='justify-end flex border-b pb-3 h-max'>
      <Avatar />
      <Menu />
    </header>
  )
}
