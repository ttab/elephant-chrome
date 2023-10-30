import { AppMenu, ThemeSwitcher } from '@/components'
import { Button } from '@ttab/elephant-ui'
import { Maximize2 } from '@ttab/elephant-ui/icons'

export const AppHeader = (): JSX.Element => {
  return (
    <header className="justify-end flex">
      <Button variant="ghost" className="w-9 px-0">
        <Maximize2 className='h-[1.2rem] w-[1.2rem]'/>
      </Button>
      <ThemeSwitcher />
      <AppMenu />
    </header>
  )
}
