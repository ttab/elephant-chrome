import { ThemeSwitcher } from './ThemeSwitcher'
import { Menu } from './Menu'
import { Avatar } from './Avatar'

export const AppHeader = (): JSX.Element => {
  return (
    <header className='justify-end flex'>
      <Avatar />
      <ThemeSwitcher />
      <Menu />
    </header>
  )
}
