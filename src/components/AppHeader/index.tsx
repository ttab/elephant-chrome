import { AppMenu, ThemeSwitcher } from '@/components'
import { Button } from '@ttab/elephant-ui'
import { Maximize2 } from '@ttab/elephant-ui/icons'

export const AppHeader = (): JSX.Element => {
  return (
    <header className='justify-end flex'>
      <ThemeSwitcher />
      <AppMenu />
    </header>
  )
}
