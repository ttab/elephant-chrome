import { useLink } from '@/hooks/useLink'
import { useUser } from '@/hooks/useUserDoc'
import { type EleDocumentResponse } from '@/shared/types'
import { type View } from '@/types/index'
import { GanttChartSquare } from '@ttab/elephant-ui/icons'
import useSWR from 'swr'
import type { NewItem } from './Root'

const BASE_URL = import.meta.env.BASE_URL || ''

export const List = ({ type, createdIdRef, asDialog }: {
  type: View
  createdIdRef: React.MutableRefObject<string | undefined>
  asDialog?: boolean
}): JSX.Element | null => {
  const openPlanning = useLink('Planning')
  const [newDocuments = []] = useUser<NewItem[]>(type)

  const createdDocument = newDocuments.find(({ id }) => id === createdIdRef.current)

  const { data: document, error } = useSWR<EleDocumentResponse, Error>(
    createdDocument || null,
    async (createdDocument: { id: string, timestamps: number } | undefined): Promise<EleDocumentResponse> => {
      const response = await fetch(`${BASE_URL}/api/documents/${createdDocument?.id}`)
      const result = await response.json() as Promise<EleDocumentResponse>
      return result
    }
  )

  if (error) return <div>Failed to load</div>
  if (!document) return null

  return (
    <div>
      <a
        href='#'
        className='flex flex-start items-center text-sm gap-2 p-2 -ml-2 rounded-sm hover:bg-gray-100'
        onClick={(evt) => {
          if (!asDialog) {
            openPlanning(evt, { id: document?.document?.uuid })
          }
        }}
      >
        <GanttChartSquare strokeWidth={1.75} size={18} className='text-muted-foreground' />
        {document.document?.title}
      </a>
    </div>
  )
}
