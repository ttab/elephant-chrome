import { TextBox } from '@/components/ui'
import { snapshotDocument } from '@/lib/snapshotDocument'
import { useYValue, type YDocument } from '@/modules/yjs/hooks'
import { toSlateYXmlText } from '@/shared/yUtils'
import { useRef, type JSX } from 'react'
import { toast } from 'sonner'
import * as Y from 'yjs'

export const ArticleTitle = ({ ydoc }: {
  ydoc: YDocument<Y.Map<unknown>>
}): JSX.Element | null => {
  const [value] = useYValue<Y.XmlText>(ydoc.ele, 'root.title', true)
  const isDirtyRef = useRef(false)

  // Breaking change: Old documents might have title as string
  // We need to migrate them to Y.XmlText
  const root = ydoc.ele?.get('root') as Y.Map<unknown>
  const title = root?.get('title')

  if (typeof title === 'string') {
    if (root instanceof Y.Map) {
      root?.set('title', toSlateYXmlText(title))
    }
  }

  return (
    <div className='flex flex-row gap-1 justify-start items-center @7xl/view:-ml-20'>
      <div className='flex flex-row gap-2 justify-start items-center'>
        <TextBox
          singleLine
          ydoc={ydoc}
          value={value}
          placeholder='Printartikelnamn'
          onChange={() => isDirtyRef.current = true}
          onBlur={() => {
            if (isDirtyRef.current) {
              snapshotDocument(ydoc.id, undefined, ydoc.provider?.document)
                .then(() => {
                  toast.success('Titel uppdaterad')
                }).catch((error) => {
                  toast.error('Kunde inte uppdatera titel')
                  console.error('Error updating title:', error)
                })

              isDirtyRef.current = false
            }
          }}
        />
      </div>
    </div>
  )
}
