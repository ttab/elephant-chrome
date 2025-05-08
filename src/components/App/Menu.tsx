import {
  Button,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@ttab/elephant-ui'
import { Avatar, Link } from '@/components'
import { Menu as MenuIcon, X } from '@ttab/elephant-ui/icons'
import { ThemeSwitcher } from './ThemeSwitcher'
import { MenuItem } from './MenuItem'
import { signOut, useSession } from 'next-auth/react'
import { applicationMenu, type ApplicationMenuItem, type MenuGroups } from '@/defaults/applicationMenuItems'
import { useUserTracker } from '@/hooks/useUserTracker'
import { cn } from '@ttab/elephant-ui/utils'
import { useCallback, useRef, useState } from 'react'
import { Latest as LatestComponent } from '@/views/Latest'

const BASE_URL = import.meta.env.BASE_URL
const hasUserDoc = (obj: object | undefined) => obj && Object.keys(obj).length > 0

interface SheetComponentProps {
  setOpen: (open: boolean) => void
}

export const Menu = (): JSX.Element => {
  const { data } = useSession()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [user] = useUserTracker<object>('')
  const [mainOpen, setMainMenuOpen] = useState<boolean>(false)

  const sheetComponents: Record<string, React.ComponentType<SheetComponentProps>> = {
    Latest: LatestComponent
  }

  const setOpen = useCallback((open: boolean) => {
    setMainMenuOpen(open)
  }, [])

  return (
    <Sheet
      open={mainOpen}
      onOpenChange={() => {
        setMainMenuOpen(!mainOpen)
      }}
    >
      <SheetTrigger ref={triggerRef} className='rounded-md hover:bg-gray-100 hover:border w-9 h-9 flex items-center justify-center'>
        <MenuIcon strokeWidth={2.25} size={18} />
      </SheetTrigger>

      <SheetContent
        allowPropagationForKeys={['Escape', 'ArrowDown', 'ArrowUp']}
        onCloseAutoFocus={(event) => {
          event.preventDefault()
        }}
        side='left'
        className='p-0 flex flex-col justify-between'
      >
        <div>
          <SheetHeader>
            <SheetDescription />
            <SheetTitle className='flex flex-row gap-4 justify-between justify-items-center items-center h-14 px-4'>
              <SheetClose className='rounded-md hover:bg-gray-100 w-9 h-9 flex items-center justify-center'>
                <X strokeWidth={2.25} />
              </SheetClose>
              <SheetClose asChild>
                <Link to='Plannings' className='leading-9 px-3 rounded-md'>
                  <img src='/elephant/dist/assets/elephant-logo-blueberry.svg' alt='Elefant' className='w-full h-6' />
                </Link>
              </SheetClose>
              <ThemeSwitcher />
            </SheetTitle>
          </SheetHeader>

          <div className='px-3 py-4 border-t flex flex-col divide-y divide-slate-300'>
            {applicationMenu.groups.map((group: MenuGroups) => {
              return (
                <div key={group.name}>
                  {group.items.map((item: ApplicationMenuItem) => {
                    if (item.target === 'sheet') {
                      const SheetItemComponent = sheetComponents[item.name]

                      return (
                        <Sheet
                          key={item.name}
                          onOpenChange={(isOpen) => {
                            if (!isOpen) {
                              setMainMenuOpen(false)
                            }
                          }}
                        >
                          <SheetTrigger className='rounded-md hover:bg-gray-100 h-9 px-3 w-full'>
                            <div className='flex items-center gap-3'>
                              <item.icon strokeWidth={2.25} size={18} color={item.color} />
                              <div className='pl-2'>{item.label}</div>
                            </div>
                          </SheetTrigger>
                          <SheetContent
                            side='left'
                            className='p-0 min-h-screen focus:outline-none pb-6 max-w-[1200px] mx-auto rounded-t rounded-lg'
                          >
                            <SheetHeader>
                              <SheetDescription />
                              <SheetTitle className='flex flex-row gap-4 justify-between justify-items-center items-center h-14 px-4 border-b'>
                                <SheetClose className='rounded-md hover:bg-gray-100 w-9 h-9 flex items-center justify-center'>
                                  <X strokeWidth={2.25} />
                                </SheetClose>
                                <SheetClose asChild>
                                  <div className='flex items-center gap-2'>
                                    <div>{item.label}</div>
                                    <item.icon strokeWidth={2.25} size={18} color={item.color} />
                                  </div>
                                </SheetClose>
                                <ThemeSwitcher />
                              </SheetTitle>
                            </SheetHeader>

                            {SheetItemComponent && <SheetItemComponent setOpen={setOpen} />}
                          </SheetContent>
                        </Sheet>
                      )
                    }
                    return <MenuItem key={item.name} menuItem={item} />
                  })}
                </div>
              )
            })}
          </div>
        </div>

        <div className='justify-self-end flex flex-col items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800 mt-10 pb-6'>

          <div className={cn({
            'border-green-400': hasUserDoc(user),
            'border-red-400': !hasUserDoc(user)
          }, 'border-4 rounded-full -mt-7')}
          >
            <Avatar user={data?.user} size='xl' variant='color' />
          </div>

          <div className='p-2 py-4 pb-4 leading-loose text-center'>
            <div className='font-bold'>{data?.user.name || '(Namn saknas)'}</div>
            <div className='text-xs opacity-60'></div>
          </div>

          <SheetClose asChild>
            <Button
              variant='outline'
              onClick={(event) => {
                event.preventDefault()

                signOut({ redirectTo: `${BASE_URL}/api/signout`, redirect: true })
                  .catch((error) => console.error(error))
                localStorage.removeItem('trustGoogle')
              }}
              className='gap-4'
            >
              Logga ut
            </Button>
          </SheetClose>

        </div>
      </SheetContent>
    </Sheet>
  )
}
