import { yTextToSlateElement } from '@slate-yjs/core'
import { revertFactbox } from '@/shared/transformations/newsdoc/core/factbox'
import { Document } from '@ttab/elephant-api/newsdoc'
import { TextbitElement, type TBElement } from '@ttab/textbit'
import type * as Y from 'yjs'
import type { Repository } from '@/shared/Repository'
import { toast } from 'sonner'

export async function handleSaveFactbox({
  id,
  content,
  repository,
  documentLanguage,
  accessToken,
  onClose
}: {
  id: string
  content: Y.XmlText
  repository: Repository
  documentLanguage: string
  accessToken: string
  onClose: () => void
}) {
  if (!id || !content || !repository || !accessToken) {
    toast.error('Kunde inte spara faktaruta!')
    throw new Error('Could not save factbox: missing data')
  }

  const { children } = yTextToSlateElement(content)
  const factboxElement = (children as TBElement[]).find((el) =>
    TextbitElement.isElement(el)
    && el.type === 'core/factbox'
    && el.properties?.original_id === id
  )

  if (!factboxElement) {
    return
  }

  if (!documentLanguage) {
    toast.error('Kunde inte spara faktaruta!')
    throw new Error('Could not save factbox: document language missing')
  }

  const factboxBlock = revertFactbox(factboxElement)

  const document = Document.create({
    uuid: id,
    type: 'core/factbox',
    uri: `core://factbox/${id}`,
    language: documentLanguage,
    title: factboxBlock.title,
    content: factboxBlock.content
  })

  await repository.saveDocument(document, accessToken, 'usable')
    .then(() => toast.success('Faktarutan har sparats'))
    .catch((error) => {
      throw new Error('Could not save factbox', { cause: error })
    })
    .finally(() => onClose?.())
}
