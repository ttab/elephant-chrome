import { Menu } from './Menu'
import { Avatar } from './Avatar'

export const AppHeader = (): JSX.Element => {
  return (
    <header className='justify-end flex border-b pt-1 pb-[11px] h-max bg-background'>
      <Avatar />
      <Menu />
    </header>
  )
}
