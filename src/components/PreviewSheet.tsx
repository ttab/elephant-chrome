import { SheetClose } from '@ttab/elephant-ui'
import { XIcon } from '@ttab/elephant-ui/icons'
import { Editor } from '../components/PlainEditor'
import { FaroErrorBoundary } from '@grafana/faro-react'
import { Error } from '@/views'
import type { Status as DocumentStatuses } from '@ttab/elephant-api/repository'
import { useEffect, useRef, type JSX } from 'react'

export const PreviewSheet = ({ id, handleClose, textOnly = true, version, versionStatusHistory }: {
  id: string
  textOnly?: boolean
  version?: bigint
  versionStatusHistory?: DocumentStatuses[]
  handleClose: () => void
}): JSX.Element => {
  const containerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    containerRef.current = (document.getElementById(id))
  }, [id])


  return (
    <FaroErrorBoundary fallback={(error) => <Error error={error} />}>
      <div className='w-full flex flex-col gap-4'>
        <div className='flex flex-row gap-6 justify-between items-center'>
          <div className='flex flex-row gap-2'>
            <SheetClose
              className='rounded-md hover:bg-gray-100 w-8 h-8 flex items-center justify-center outline-none -mr-7'
              onClick={handleClose}
            >
              <XIcon strokeWidth={1.75} size={18} />
            </SheetClose>
          </div>
        </div>
        <div className='flex flex-col h-full'>
          <Editor id={id} textOnly={textOnly} version={version} versionStatusHistory={versionStatusHistory} direct />
        </div>
      </div>
    </FaroErrorBoundary>
  )
}
