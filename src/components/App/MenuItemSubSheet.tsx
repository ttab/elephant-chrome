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
  const sheetComponents: Record<string, React.ComponentType<SheetComponentProps>> = {
    Latest: LatestComponent
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
            <SheetClose className='rounded-md hover:bg-gray-100 w-9 h-9 flex items-center justify-center'>
              <XIcon strokeWidth={2.25} />
            </SheetClose>

            <div className='flex items-center gap-2'>
              <div>{menuItem.label}</div>
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
