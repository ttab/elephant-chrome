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

  const showTranslatedText = (menuItem: string): string => {
    switch (menuItem) {
      case 'plannings': return t('app.mainMenu.plans')
      case 'approvals': return t('app.mainMenu.approvals')
      case 'events': return t('app.mainMenu.events')
      case 'assignments': return t('app.mainMenu.assignments')
      case 'wires': return t('app.mainMenu.wires')
      case 'factboxes': return t('app.mainMenu.factboxes')
      case 'search': return t('app.mainMenu.search')
      case 'print': return t('app.mainMenu.print')
      default:
        return 'Translation missing'
    }
  }
  return (
    <SheetClose asChild key={menuItem.name}>
      <Link to={menuItem.name} className='flex gap-3 items-center px-3 py-2 rounded-md hover:bg-table-focused'>
        <div className='flex items-center justify-center opacity-80 pr-2'>
          <menuItem.icon strokeWidth={1.75} size={18} color={menuItem.color} />
        </div>
        <div>{showTranslatedText(menuItem.label)}</div>
      </Link>
    </SheetClose>
  )
}

const MenuItemDialogOpener = ({ menuItem }: {
  menuItem: ApplicationMenuItem
}): JSX.Element => {
  const { showModal, hideModal } = useModal()
  const { t } = useTranslation()

  const showTranslatedText = (menuItem: string): string => {
    switch (menuItem) {
      case 'flash': return t('app.mainMenu.flash')
      default:
        return ''
    }
  }

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
      <div>{showTranslatedText(menuItem.label)}</div>
    </SheetClose>
  )
}
