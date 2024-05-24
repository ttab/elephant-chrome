import { Menu } from './Menu'

export const AppHeader = (): JSX.Element => {
  return (
    <header className='justify-end flex gap-3 pl-4 border-b items-center h-14 bg-background pr-3'>
      <Menu />
    </header >
  )
}
