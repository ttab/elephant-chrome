import { View } from '@/components'
import {
  ScrollArea
} from '@ttab/elephant-ui'
import { type ViewMetadata } from '@/types'
import { PreviewHeader } from './PreviewHeader'

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
const PrintPreview = (): JSX.Element => {
  return (
    <>
      <PreviewHeader />

      <View.Content className='flex flex-col max-w-[1200px]'>
        <div className='p-2 flex flex-col gap-2'>
          <ScrollArea className='h-full mx-auto w-full'>
            <iframe src='https://ttnewsagency-resources.s3.eu-west-1.amazonaws.com/slask/preview.pdf' height='980' width='100%' />
          </ScrollArea>
        </div>
      </View.Content>
    </>
  )
}

PrintPreview.meta = meta

export { PrintPreview }
