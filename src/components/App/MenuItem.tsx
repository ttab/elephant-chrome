import { Link } from '@/components/index'
import { type ApplicationMenuItem } from '@/defaults/applicationMenuItems'
import { SheetClose } from '@ttab/elephant-ui'
import { useModal } from '../Modal/useModal'
import * as Views from '@/views'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

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
}): JSX.Element => {
  const { t } = useTranslation()
  return (
    <SheetClose asChild key={menuItem.name}>
      <Link to={menuItem.name} className='flex gap-3 items-center px-3 py-2 rounded-md hover:bg-table-focused'>
        <div className='flex items-center justify-center opacity-80 pr-2'>
          <menuItem.icon strokeWidth={1.75} size={18} color={menuItem.color} />
        </div>
        <div>{t(`${menuItem.translationKey}`)}</div>
      </Link>
    </SheetClose>
  )
}

const MenuItemDialogOpener = ({ menuItem }: {
  menuItem: ApplicationMenuItem
}): JSX.Element => {
  const { showModal, hideModal } = useModal()
  const { t } = useTranslation()

  const ViewDialog = Views[menuItem.name]
  return (
    <SheetClose
      key={menuItem.name}
      className='w-full flex gap-3 items-center px-3 py-2 rounded-md hover:bg-table-focused hover:cursor-pointer'
      onClick={() => {
        showModal(
          <ViewDialog onDialogClose={hideModal} asDialog />
        )
      }}
    >
      <div className='flex items-center justify-center opacity-80 pr-2'>
        <menuItem.icon strokeWidth={1.75} size={18} color={menuItem.color} />
      </div>
      <div>{t(`${menuItem.translationKey}`)}</div>
    </SheetClose>
  )
}
