import { Link } from '@/components/index'
import {
  type ApplicationMenuItem
} from '@/defaults/applicationMenuItems'
import { SheetClose } from '@ttab/elephant-ui'
import { CreateDocumentDialog } from '../View/ViewHeader/CreateDocumentDialog'
import { useModal } from '../Modal/useModal'
import * as Views from '@/views'
import { type Document } from '@/protos/service'
import { useActiveDocument } from '@/hooks/useActiveDocument'
import { useActiveAuthor } from '@/hooks/useActiveAuthor'
import * as Templates from '@/defaults/templates'
import { type View } from '@/types/index'
import { useMemo, useState } from 'react'
import * as Y from 'yjs'
import { createDocument } from '@/lib/createYItem'


export const MenuItem = ({ menuItem }: {
  menuItem: ApplicationMenuItem
}): JSX.Element => {
  return (
    <>
      {menuItem?.mode !== 'dialog'
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
  const { showModal } = useModal()

  return (
    <SheetClose asChild key={menuItem.name}>
      <a href="#" onClick={(e) => {
        e.preventDefault()
        showModal(<DialogContent type={menuItem.name}></DialogContent>)
      }} className='flex gap-3 items-center px-3 py-2 rounded-md hover:bg-gray-100 hover:cursor-pointer'
      >
        <div className='flex items-center justify-center opacity-80 pr-2'>
          <menuItem.icon strokeWidth={1.75} size={18} />
        </div>
        <div>{menuItem.label}</div>
      </a>
    </SheetClose>
  )
}


const DialogContent = ({ type }: {
  type: 'Flash' | 'Planning' | 'Event'
}): JSX.Element => {
  const DocumentView = type && Views[type]
  const activeDocument = useActiveDocument({ type: 'Planning' })
  const author = useActiveAuthor({ full: true })

  const document = useMemo(() => {
    if ([activeDocument, author].includes(undefined)) {
      return
    }

    const flashDefaults: Record<string, unknown> = {}

    flashDefaults.title = activeDocument?.title || ''
    if (author !== undefined) {
      // FIXME: Set author
    }

    const section = activeDocument?.links?.['core/section']?.[0]
    if (section) {
      flashDefaults.section = {
        uuid: section.uuid,
        title: section.title
      }
    }

    const document = createDocument(getTemplate(type), true, { ...flashDefaults })

    return document
  }, [type, activeDocument, author])


  if (!document) {
    return <></>
  }

  return <DocumentView
    id={document[0]}
    document={document[1]}
    className='p-0 rounded-md'
    asCreateDialog
    onDialogClose={() => { }}
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
