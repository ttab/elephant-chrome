import { Link } from '@/components/index'
import {
  type ApplicationMenuItem
} from '@/defaults/applicationMenuItems'
import { SheetClose } from '@ttab/elephant-ui'
import { useModal } from '../Modal/useModal'
import * as Views from '@/views'

export const MenuItem = ({ menuItem }: {
  menuItem: ApplicationMenuItem
}): JSX.Element => {
  return (
    <>
      {menuItem?.target !== 'dialog'
        ? <MenuItemViewOpener menuItem={menuItem} />
        : <MenuItemDialogOpener menuItem={menuItem} />}
    </>
  )
}

const MenuItemViewOpener = ({ menuItem }: {
  menuItem: ApplicationMenuItem
}): JSX.Element => (
  <SheetClose asChild key={menuItem.name}>
    <Link to={menuItem.name} className='flex gap-3 items-center px-3 py-2 rounded-md hover:bg-gray-100'>
      <div className='flex items-center justify-center opacity-80 pr-2'>
        <menuItem.icon strokeWidth={1.75} size={18} color={menuItem.color} />
      </div>
      <div>{menuItem.label}</div>
    </Link>
  </SheetClose>
)

const MenuItemDialogOpener = ({ menuItem }: {
  menuItem: ApplicationMenuItem
}): JSX.Element => {
  const { showModal, hideModal } = useModal()

  const ViewDialog = Views[menuItem.name]
  return (
    <SheetClose
      key={menuItem.name}
      className='w-full flex gap-3 items-center px-3 py-2 rounded-md hover:bg-gray-100 hover:cursor-pointer'
      onClick={() => {
        showModal(
          <ViewDialog onDialogClose={hideModal} asDialog />
        )
      }}
    >
      <div className='flex items-center justify-center opacity-80 pr-2'>
        <menuItem.icon strokeWidth={1.75} size={18} color={menuItem.color} />
      </div>
      <div>{menuItem.label}</div>
    </SheetClose>
  )
}
