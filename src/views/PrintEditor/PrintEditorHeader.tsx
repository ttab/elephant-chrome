import { useView, useYValue } from '@/hooks'
import { useEffect, useRef, useState } from 'react'
import { ViewHeader } from '@/components/View'
import { StatusMenu } from '@/components/DocumentStatus/StatusMenu'
import { PenBoxIcon } from '@ttab/elephant-ui/icons'
import { AddNote } from '../Editor/components/Notes/AddNote'
import { snapshot } from '@/lib/snapshot'
import { toast } from 'sonner'

/**
 * EditorHeader component.
 *
 * This component represents the header section of the Print Editor. It includes
 * the title, input for the print article name, and controls for adding notes and
 * managing document status.
 *
 * @param props - The properties object.
 * @param props.documentId - The unique identifier for the document.
 *
 * @returns The rendered EditorHeader component.
 *
 * @remarks
 * The component uses the `useView` hook to get the current view ID and manages
 * a reference to the container element. It also includes a button to refresh
 * layouts and displays remote users and document status if a document ID is provided.
 */

export const EditorHeader = ({
  documentId,
  flowName,
  isChanged
}: {
  documentId: string
  flowName?: string
  isChanged?: boolean
}): JSX.Element => {
  const { viewId } = useView()
  const containerRef = useRef<HTMLElement | null>(null)
  useEffect(() => {
    containerRef.current = document.getElementById(viewId)
  }, [viewId])
  const [isDirty, setIsDirty] = useState(false)
  const [title, setTitle] = useYValue<string>('root.title')

  return (
    <ViewHeader.Root className='@container grid grid-cols-2'>
      <section className='col-span-2 flex flex-row gap-2 justify-between items-center w-full'>
        <div className='hidden @printEditor:block'>
          <ViewHeader.Title name={flowName || ''} title={flowName || ''} icon={PenBoxIcon} />
        </div>

        <ViewHeader.Content className='justify-start w-full'>
          <div className='max-w-[1040px] mx-auto flex flex-row gap-2 justify-between items-center w-full'>
            <div className='flex flex-row gap-1 justify-start items-center @7xl/view:-ml-20'>
              <div className='flex flex-row gap-2 justify-start items-center'>
                <input
                  type='text'
                  placeholder='Printartikelnamn'
                  className='px-2 py-1 w-[130px] @printEditor:w-full'
                  value={title}
                  onChange={(e) => {
                    setIsDirty(true)
                    setTitle(e.target.value)
                  }}
                  onBlur={() => {
                    if (isDirty) {
                      setIsDirty(false)
                      snapshot(documentId).then(() => {
                        toast.success('Titel uppdaterad')
                      }).catch((error) => {
                        console.error('Error updating title:', error)
                      })
                    }
                  }}
                />
              </div>
            </div>
            <div className='flex flex-row gap-2 justify-end items-center'>
              <div className='hidden @printEditor:block'><AddNote /></div>
              {!!documentId && (
                <>
                  <ViewHeader.RemoteUsers documentId={documentId} />
                  <StatusMenu
                    documentId={documentId}
                    type='tt/print-article'
                    isChanged={isChanged}
                  />
                </>
              )}
            </div>
          </div>
        </ViewHeader.Content>
        <ViewHeader.Action>
        </ViewHeader.Action>
      </section>
    </ViewHeader.Root>
  )
}
