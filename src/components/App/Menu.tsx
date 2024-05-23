import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@ttab/elephant-ui'
import { Avatar, Link } from '@/components'
import { CalendarDaysIcon, Menu as MenuIcon, X } from '@ttab/elephant-ui/icons'
import { ThemeSwitcher } from './ThemeSwitcher'
import { useSession } from '@/hooks/useSession'

export const Menu = (): JSX.Element => {
  const { jwt } = useSession()

  return (
    <Sheet>
      <SheetTrigger className="rounded-md hover:bg-gray-100 w-9 h-9 flex items-center justify-center">
        <MenuIcon strokeWidth={2.25} size={18} />
      </SheetTrigger>

      <SheetContent side="left" className="w-100vw p-0" defaultClose={false}>

        <SheetHeader>
          <SheetTitle className="flex flex-row gap-4 justify-between justify-items-center items-center h-14 px-4 border-b">
            <SheetClose className="rounded-md hover:bg-gray-100 w-9 h-9 flex items-center justify-center">
              <X strokeWidth={2.25} />
            </SheetClose>

            <SheetClose asChild>
              <Link to='PlanningOverview' className="leading-9 px-3 rounded-md">
                Elefanten
                <span className="text-2xl pl-2">🐘</span>
              </Link>
            </SheetClose>

            <ThemeSwitcher />
          </SheetTitle>
        </SheetHeader>

        <div className="">

          <div className="flex flex-col items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800 mb-10">
            <div className="p-2 py-4 leading-loose text-center">
              <div className="font-bold">{jwt?.sub_name || '(Namn saknas)'}</div>
              <div className="text-xs opacity-60">{jwt?.scope}</div>
            </div>
            <div className="border-4 border-background rounded-full -mb-7">
              <Avatar value={jwt?.sub_name || '??'} size="xl" variant="color" />
            </div>
          </div>


          <div className="px-3 py-4 border-y">

            <SheetClose asChild>
              <Link to='PlanningOverview' className="flex gap-3 items-center px-3 py-2 rounded-md  hover:bg-gray-100">
                <div className="flex items-center justify-center opacity-80 pr-2">
                  <CalendarDaysIcon strokeWidth={1.75} size={18} />
                </div>
                <div>Planeringsöversikt</div>
              </Link>
            </SheetClose>

          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
