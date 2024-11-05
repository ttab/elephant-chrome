import { Link } from '@/components/index'
import {
  type ApplicationMenuItem
} from '@/defaults/applicationMenuItems'
import { SheetClose } from '@ttab/elephant-ui'
import { useModal } from '../Modal/useModal'
import * as Views from '@/views'
import type { Block, Document } from '@ttab/elephant-api/newsdoc'
import { useActiveDocument } from '@/hooks/useActiveDocument'
import { useActiveAuthor } from '@/hooks/useActiveAuthor'
import * as Templates from '@/defaults/templates'
import { type View } from '@/types/index'
import { useMemo } from 'react'
import { createDocument } from '@/lib/createYItem'
import type { IDBAuthor } from 'src/datastore/types'


export const MenuItem = ({ menuItem }: {
  menuItem: ApplicationMenuItem
}): JSX.Element => {
  return (
    <>
      {menuItem?.target !== 'dialog'
        ? <MenuItemViewOpener menuItem={menuItem} />
        : <MenuItemDialogOpener menuItem={menuItem} />
      }
    </>
  )
}

export const MenuItemViewOpener = ({ menuItem }: {
  menuItem: ApplicationMenuItem
}): JSX.Element => {
  return (
    <SheetClose asChild key={menuItem.name}>
      <Link to={menuItem.name} className='flex gap-3 items-center px-3 py-2 rounded-md hover:bg-gray-100'>
        <div className='flex items-center justify-center opacity-80 pr-2'>
          <menuItem.icon strokeWidth={1.75} size={18} />
        </div>
        <div>{menuItem.label}</div>
      </Link >
    </SheetClose >
  )
}

export const MenuItemDialogOpener = ({ menuItem }: {
  menuItem: ApplicationMenuItem
}): JSX.Element => {
  const { showModal, hideModal } = useModal()

  return (
    <SheetClose
      key={menuItem.name}
      className='w-full flex gap-3 items-center px-3 py-2 rounded-md hover:bg-gray-100 hover:cursor-pointer'
      onClick={() => {
        showModal(<>
          {
            menuItem.name === 'Flash'
              ? <FlashDialogContent menuItem={menuItem} onDialogClose={hideModal} />
              : <DialogContent menuItem={menuItem} onDialogClose={hideModal} />
          }
        </>)
      }}>
      <div className='flex items-center justify-center opacity-80 pr-2'>
        <menuItem.icon strokeWidth={1.75} size={18} />
      </div>
      <div>{menuItem.label}</div>
    </SheetClose >
  )
}

/**
 * Generic component to render a document view in a dialog
 */
const DialogContent = ({ menuItem, onDialogClose }: {
  menuItem: ApplicationMenuItem
  onDialogClose?: () => void
}): JSX.Element => {
  const { name } = menuItem
  const DocumentView = name && Views[name]

  const document = useMemo(() => {
    return createDocument(getTemplate(name), true, {})
  }, [name])


  if (!document) {
    return <></>
  }

  return <DocumentView
    id={document[0]}
    document={document[1]}
    className='p-0 rounded-md'
    asDialog={true}
    onDialogClose={onDialogClose}
  />
}


/**
 * Component to render a flash editor in a dialog, based on planning if in active view
 *
 * TODO: This should be refactored out of this generic MenuItem component
 */
const FlashDialogContent = ({ menuItem, onDialogClose }: {
  menuItem: ApplicationMenuItem
  onDialogClose?: () => void
}): JSX.Element => {
  const { name } = menuItem
  const DocumentView = name && Views[name]
  const activeDocument = useActiveDocument({ type: 'Planning' })
  const author = useActiveAuthor() as IDBAuthor

  const [document, planning] = useMemo(() => {
    if ([activeDocument, author].includes(undefined)) {
      return []
    }

    const flashDefaults: Record<string, unknown> = {
      title: activeDocument?.title || ''
    }

    if (author) {
      flashDefaults.authors = [{ uuid: author.id, name: author.name }]
    }

    const planning = activeDocument
      ? {
          uuid: activeDocument?.uuid,
          title: activeDocument?.title
        }
      : undefined

    const section = (activeDocument?.links as unknown as Record<string, Block[]>)?.['core/section']?.[0]
    if (section) {
      flashDefaults.section = {
        uuid: section.uuid,
        title: section.title
      }
    }

    return [
      createDocument(
        getTemplate(name), true, { ...flashDefaults }
      ),
      planning
    ]
  }, [name, activeDocument, author])

  if (!document) {
    return <></>
  }

  return <DocumentView
    id={document[0]}
    document={document[1]}
    defaultPlanningItem={planning}
    className='p-0 rounded-md'
    asDialog={true}
    onDialogClose={onDialogClose}
  />
}


function getTemplate(type: View): (id: string) => Document {
  switch (type) {
    case 'Planning':
      return Templates.planning

    case 'Flash':
      return Templates.flash

    case 'Event':
      return Templates.event

    default:
      throw new Error(`No template for ${type}`)
  }
}
