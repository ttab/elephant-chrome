import { View } from '@/components'
import {
  ScrollArea
} from '@ttab/elephant-ui'
import { type ViewProps, type ViewMetadata } from '@/types'
import { PreviewHeader } from './PreviewHeader'
import { useEffect, useState } from 'react'
import { Frown, Settings } from '@ttab/elephant-ui/icons'
/**
 * PrintPreview component.
 *
 * This component renders a preview of a document using an iframe. It includes a header
 * with actions and a scrollable area to view the document. The document is fetched from
 * a predefined URL and displayed within the iframe.
 *
 * @returns The rendered PrintPreview component.
 *
 * @remarks
 * The component uses a responsive layout with a maximum width of 1200px. The iframe
 * is set to a fixed height of 980px and takes the full width of its container.
 */


// Metadata definition
const meta: ViewMetadata = {
  name: 'PrintPreview',
  path: `${import.meta.env.BASE_URL || ''}/print`,
  widths: {
    sm: 12,
    md: 12,
    lg: 6,
    xl: 6,
    '2xl': 6,
    hd: 6,
    fhd: 6,
    qhd: 3,
    uhd: 2
  }
}

// Main Editor Component - Handles document initialization
const PrintPreview = (props: ViewProps): JSX.Element => {
  const [height, setHeight] = useState(0)
  useEffect(() => {
    setHeight(window.innerHeight - 70)
    window.addEventListener('resize', () => {
      setHeight(window.innerHeight - 70)
    })
    return () => {
      window.removeEventListener('resize', () => {})
    }
  }, [])
  if (props?.id === 'error') {
    return (
      <>
        <PreviewHeader />
        <main className='flex flex-col items-center justify-center h-full'>
          <section className='flex flex-row items-center justify-center gap-4 text-red-500'>
            <Frown strokeWidth={1.75} size={24} color='red' />
            <p className='text-red-500'>Fel vid renderingen av artikeln</p>
          </section>
        </main>
      </>
    )
  }
  return (
    <>
      <PreviewHeader />
      {!props?.id
        ? (
            <main className='flex flex-col items-center justify-center h-full'>
              <section className='flex flex-row items-center justify-center gap-0'>
                <div className='animate-spin'>
                  <Settings className='animate-pulse text-[#006bb3]' strokeWidth={1.75} size={24} />
                </div>
                <div className='animate-spin mt-4'>
                  <Settings className='animate-pulse text-[#006bb3]' strokeWidth={1.75} size={24} />
                </div>
                <div className='animate-spin'>
                  <Settings className='animate-pulse text-[#006bb3]' strokeWidth={1.75} size={24} />
                </div>
              </section>
            </main>
          )
        : (
            <>
              <View.Content className='flex flex-col max-w-[1200px]'>
                <div className='p-2 flex flex-col gap-2'>
                  <ScrollArea className='h-full mx-auto w-full'>
                    <iframe src={props?.id || ''} height={height} width='100%' />
                  </ScrollArea>
                </div>
              </View.Content>
            </>
          )}
    </>
  )
}

PrintPreview.meta = meta

export { PrintPreview }
