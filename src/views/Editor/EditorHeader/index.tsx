import { useDocumentStatus, useView } from '@/hooks'
import { Newsvalue } from '@/components/Newsvalue'
import { useEffect, useRef } from 'react'
import { MetaSheet } from '../components/MetaSheet'
import { DocumentStatus } from '@/components/TmpDocumentStatus'
import { AddNote } from '../components/Notes/AddNote'

export const EditorHeader = ({ documentId }: { documentId: string }): JSX.Element => {
  const { viewId } = useView()
  const [documentStatus, setDocumentStatus] = useDocumentStatus(documentId)

  const containerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    containerRef.current = (document.getElementById(viewId))
  }, [viewId])

  return (
    <div className='flex flex-row gap-2 items-center'>
      <Newsvalue />
      <DocumentStatus status={documentStatus} setStatus={setDocumentStatus} />
      <AddNote />
      <MetaSheet container={containerRef.current} />
    </div>
  )
}
