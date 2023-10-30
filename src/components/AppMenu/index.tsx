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
import { Menu } from '@ttab/elephant-ui/icons'

export const AppMenu = (): JSX.Element => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant='ghost' className='w-9 px-0'>
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            <span className='text-[52px]'>🐘</span>Elefanten
          </SheetTitle>
        </SheetHeader>
        <div className='grid gap-4 py-4'>
          <SheetClose asChild>
            <Link to='Init'>Start</Link>
          </SheetClose>
          <Link to='Editor'>Editor</Link>
          <Link to='Planning'>Planning</Link>
        </div>
        <SheetFooter>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
