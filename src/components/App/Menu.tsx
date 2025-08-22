import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@ttab/elephant-ui'
import { Link, Logo } from '@/components'
import { Menu as MenuIcon, X } from '@ttab/elephant-ui/icons'
import { ThemeSwitcher } from './ThemeSwitcher'
import { MenuItem } from './MenuItem'
import { useSession } from 'next-auth/react'
import { applicationMenu, type ApplicationMenuItem, type MenuGroups } from '@/defaults/applicationMenuItems'
import { useUserTracker } from '@/hooks/useUserTracker'
import { useCallback, useRef, useState } from 'react'
import { UserInfo } from './UserInfo'
import { MenuItemSubSheet } from './MenuItemSubSheet'


export const Menu = (): JSX.Element => {
  const { data } = useSession()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [user] = useUserTracker<object>('')
  const [mainOpen, setMainMenuOpen] = useState<boolean>(false)
  const [activeSubSheet, setActiveSubSheet] = useState<ApplicationMenuItem | null>(null)

  const handleSubSheetClick = useCallback((menuItem: ApplicationMenuItem) => {
    setMainMenuOpen(false) // Close main menu first
    setActiveSubSheet(menuItem) // Then open sub-sheet
  }, [])

  const handleSubSheetClose = useCallback(() => {
    setActiveSubSheet(null)
  }, [])

  // Get all sheet items for rendering sub-sheets
  const sheetItems = applicationMenu.groups
    .flatMap((group) => group.items)
    .filter((item) => item.target === 'sheet')

  return (
    <>
      {/* Main Menu Sheet */}
      <Sheet open={mainOpen} onOpenChange={setMainMenuOpen}>
        <SheetTrigger
          ref={triggerRef}
          className='rounded-md hover:bg-gray-100 hover:border w-9 h-9 flex items-center justify-center'
        >
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
            <SheetHeader className='h-14'>
              <SheetTitle className='sr-only'>Huvudmeny</SheetTitle>
              <SheetDescription className='sr-only' />

              <div className='flex flex-row gap-4 justify-between justify-items-center items-center h-14 px-4'>
                <SheetClose className='rounded-md hover:bg-gray-100 w-9 h-9 flex items-center justify-center'>
                  <X strokeWidth={2.25} />
                </SheetClose>

                <SheetClose asChild>
                  <Link to='Plannings' className='leading-9 px-3 rounded-md'>
                    <Logo className='w-full h-6' />
                  </Link>
                </SheetClose>

                <ThemeSwitcher />
              </div>
            </SheetHeader>

            <div className='px-3 py-4 border-t flex flex-col divide-y divide-slate-300'>
              {applicationMenu.groups.map((group: MenuGroups) => {
                return (
                  <div key={group.name}>
                    {group.items.map((item: ApplicationMenuItem) => {
                      if (item.target === 'sheet') {
                        return (
                          <button
                            key={item.name}
                            onClick={() => handleSubSheetClick(item)}
                            className='rounded-md hover:bg-gray-100 h-9 px-3 w-full'
                          >
                            <div className='flex items-center gap-3'>
                              <item.icon strokeWidth={2.25} size={18} color={item.color} />
                              <div className='pl-2'>{item.label}</div>
                            </div>
                          </button>
                        )
                      } else {
                        return (
                          <MenuItem
                            key={item.name}
                            menuItem={item}
                          />
                        )
                      }
                    })}
                  </div>
                )
              })}
            </div>
          </div>

          <UserInfo user={user} data={data} />
        </SheetContent>
      </Sheet>

      {/* Sub-Sheets - Rendered as siblings to main menu */}
      {sheetItems.map((menuItem) => (
        <MenuItemSubSheet
          key={menuItem.name}
          menuItem={menuItem}
          isOpen={activeSubSheet?.name === menuItem.name}
          onClose={handleSubSheetClose}
        />
      ))}
    </>
  )
}
