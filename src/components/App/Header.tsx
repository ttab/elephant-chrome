import { Menu } from './Menu'

export const AppHeader = (): JSX.Element => {
  return (
    <header className='flex px-4 items-center h-14'>
      <Menu />
    </header>
  )
}
