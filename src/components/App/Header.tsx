import { Menu } from './Menu'

export const AppHeader = (): JSX.Element => {
  return (
    <header className='flex px-4 border-b items-center h-14'>
      <Menu />
    </header>
  )
}
