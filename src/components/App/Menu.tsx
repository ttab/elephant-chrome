import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@ttab/elephant-ui'
import { Avatar, Link } from '@/components'
import { LogOut, Menu as MenuIcon, X } from '@ttab/elephant-ui/icons'
import { ThemeSwitcher } from './ThemeSwitcher'
import { MenuItem } from './MenuItem'
import { signOut, useSession } from 'next-auth/react'
import { applicationMenuItems } from '@/defaults/applicationMenuItems'

export const Menu = (): JSX.Element => {
  const { data } = useSession()

  return (
    <Sheet>
      <SheetTrigger className="rounded-md hover:bg-gray-100 w-9 h-9 flex items-center justify-center">
        <MenuIcon strokeWidth={2.25} size={18} />
      </SheetTrigger>

      <SheetContent side="left" className="p-0 flex flex-col justify-between">
        <div>
          <SheetHeader>
            <SheetTitle className="flex flex-row gap-4 justify-between justify-items-center items-center h-14 px-4">
              <SheetClose className="rounded-md hover:bg-gray-100 w-9 h-9 flex items-center justify-center">
                <X strokeWidth={2.25} />
              </SheetClose>
              <SheetClose asChild>
                <Link to='Plannings' className="leading-9 px-3 rounded-md">
                  Elefanten
                  <span className="text-2xl pl-2">🐘</span>
                </Link>
              </SheetClose>
              <ThemeSwitcher />
            </SheetTitle>
          </SheetHeader>

          <div className="px-3 py-4 border-t">
            {applicationMenuItems.map(item => {
              return <MenuItem key={item.name} menuItem={item} />
            })}
          </div>
        </div>

        <div className="justify-self-end flex flex-col items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800 mt-10 pb-6">
          <div className="border-4 border-background rounded-full -mt-7">
            <Avatar user={data?.user} size="xl" variant="color" />
          </div>

          <div className="p-2 py-4 pb-4 leading-loose text-center">
            <div className="font-bold">{data?.user.name || '(Namn saknas)'}</div>
            <div className="text-xs opacity-60">{''}</div>
          </div>

          <SheetClose asChild>
            <a href='#' onClick={(event) => {
              event.preventDefault()
              signOut()
                .catch((error) => console.error(error))
              localStorage.removeItem('trustGoogle')
            }} className="flex gap-1 items-center px-3 py-2 -ms-0.5 rounded-md text-sm bg-gray-200 hover:bg-gray-300">
              <div className="flex items-center justify-center opacity-80 pr-2">
                <LogOut strokeWidth={1.75} size={18} />
              </div>
              <div>Logga ut</div>
            </a>
          </SheetClose>

        </div>
      </SheetContent>
    </Sheet>
  )
}
