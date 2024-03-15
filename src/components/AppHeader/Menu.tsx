import {
  Button,
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@ttab/elephant-ui'
import { Link } from '@/components'
import { Menu as MenuIcon } from '@ttab/elephant-ui/icons'
import { ThemeSwitcher } from './ThemeSwitcher'

export const Menu = (): JSX.Element => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant='ghost' className='w-9 px-0'>
          <MenuIcon size={18} strokeWidth={1.75} />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            <span className='text-[52px]'>🐘</span>Elefanten
            <ThemeSwitcher />
          </SheetTitle>
        </SheetHeader>
        <div className='grid gap-4 py-4'>
          <SheetClose asChild>
            <Link to='PlanningOverview'>Planning</Link>
          </SheetClose>
        </div>
        <SheetFooter>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
