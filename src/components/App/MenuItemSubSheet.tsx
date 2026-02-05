import type { ApplicationMenuItem } from '@/defaults/applicationMenuItems'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@ttab/elephant-ui'
import { XIcon } from '@ttab/elephant-ui/icons'
import { Latest as LatestComponent } from '@/views/Latest'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

interface SheetComponentProps {
  setOpen: (open: boolean) => void
}

export const MenuItemSubSheet = ({
  menuItem,
  isOpen,
  onClose
}: {
  menuItem: ApplicationMenuItem
  isOpen: boolean
  onClose: () => void
}): JSX.Element => {
  const { t } = useTranslation('app')
  const sheetComponents: Record<string, React.ComponentType<SheetComponentProps>> = {
    Latest: LatestComponent
  }

  const showTranslatedText = (menuItem: string): string => {
    switch (menuItem) {
      case 'plannings': return t('mainMenu.plans')
      case 'approvals': return t('mainMenu.approvals')
      case 'events': return t('mainMenu.events')
      case 'assignments': return t('mainMenu.assignments')
      case 'wires': return t('mainMenu.wires')
      case 'factboxes': return t('mainMenu.factboxes')
      case 'search': return t('mainMenu.search')
      case 'print': return t('mainMenu.print')
      case 'last published': return t('mainMenu.lastPublished')
      default:
        return 'Translation missing'
    }
  }

  const SheetItemComponent = sheetComponents[menuItem.name]

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side='left'
        className='p-0 min-h-screen focus:outline-none pb-6 max-w-[1200px] mx-auto rounded-t rounded-lg'
      >
        <SheetHeader className='h-14'>
          <SheetTitle className='sr-only'>{menuItem.label}</SheetTitle>
          <SheetDescription className='sr-only' />

          <div className='flex flex-row gap-4 justify-between justify-items-center items-center h-14 px-4 border-b'>
            <SheetClose className='rounded-md hover:bg-gray-100 dark:hover:bg-table-focused w-9 h-9 flex items-center justify-center'>
              <XIcon strokeWidth={2.25} />
            </SheetClose>

            <div className='flex items-center gap-2'>
              <div>{showTranslatedText(menuItem.label)}</div>
              <menuItem.icon strokeWidth={2.25} size={18} color={menuItem.color} />
            </div>

            <div></div>
          </div>
        </SheetHeader>

        {SheetItemComponent && (
          <SheetItemComponent
            setOpen={(open) => !open && onClose()}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
