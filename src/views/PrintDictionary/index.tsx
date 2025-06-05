import { type ViewMetadata } from '@/types'
import Dictionary from './Dictionary'

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
  name: 'PrintDictionary',
  path: `${import.meta.env.BASE_URL || ''}/print`,
  widths: {
    sm: 12,
    md: 12,
    lg: 6,
    xl: 6,
    '2xl': 6,
    hd: 4,
    fhd: 4,
    qhd: 3,
    uhd: 2
  }
}

// Main Editor Component - Handles document initialization
const PrintDictionary = (): JSX.Element => {
  return (
    <Dictionary className='w-full' />
  )
}

PrintDictionary.meta = meta

export { PrintDictionary }
