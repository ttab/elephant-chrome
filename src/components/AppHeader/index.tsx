import { AppMenu, ThemeSwitcher } from '@/components'

export const AppHeader = (): JSX.Element => {
  return (
    <header className='justify-end flex'>
      <ThemeSwitcher />
      <AppMenu />
    </header>
  )
}
