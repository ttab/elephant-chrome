import { useLink } from '@/hooks/useLink'
import { useYValue } from '@/hooks/useYValue'
import { type EleDocumentResponse } from '@/shared/types'
import { type View } from '@/types/index'
import { CalendarDays } from '@ttab/elephant-ui/icons'
import useSWR from 'swr'

const BASE_URL = process.env.BASE_URL || ''

export const List = ({ type, createdIdRef }: {
  type: View
  createdIdRef: React.MutableRefObject<string | undefined>
}): JSX.Element | null => {
  const openPlanning = useLink('Planning')
  const [newDocuments = []] = useYValue<Array<{
    id: string
    timestamp: number
  }>>(type)

  const createdDocument = newDocuments.find(({ id }) => id === createdIdRef.current)

  const { data: document, error } = useSWR(
    createdDocument || null,
    async (createdDocument): Promise<EleDocumentResponse> => {
      const response = await fetch(`${BASE_URL}/api/documents/${createdDocument.id}`)
      const result = await response.json()
      return result
    }
  )

  if (error) return <div>Failed to load</div>
  if (!document) return null

  return (
    <div>
      <a href='#'
        className='flex flex-start items-center text-sm gap-2 p-2 -ml-2 rounded-sm hover:bg-gray-100'
        onClick={(evt) => {
          openPlanning(evt, { id: document?.document?.uuid })
        }}>
        <CalendarDays strokeWidth={1.75} size={18} />
        {document.document?.title}
      </a>
    </div>
  )
}
