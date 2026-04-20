import { type JSX, useState } from 'react'
import { Button } from '@ttab/elephant-ui'
import { RefreshCwIcon } from '@ttab/elephant-ui/icons'
import { useTranslation } from 'react-i18next'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
import { useConvertArticleType } from '@/hooks/useConvertArticleType'
import { useLink } from '@/hooks/useLink'
import { ConvertToArticleDialog } from './ConvertToArticleDialog'
import { ConvertToTimelessDialog } from './ConvertToTimelessDialog'

/**
 * Convert button for article ↔ timeless article. Both directions go
 * through a dialog: timeless→article needs a target date + source planning,
 * article→timeless needs a subject category.
 */
export const ArticleTypeConversion = ({ ydoc, documentType }: {
  ydoc: YDocument<Y.Map<unknown>>
  documentType: string | undefined
}): JSX.Element | null => {
  const { t } = useTranslation('metaSheet')
  const { isConverting } = useConvertArticleType()
  const openEditor = useLink('Editor')
  const [toArticleOpen, setToArticleOpen] = useState(false)
  const [toTimelessOpen, setToTimelessOpen] = useState(false)

  if (documentType !== 'core/article' && documentType !== 'core/article#timeless') {
    return null
  }

  const iconClassName = isConverting ? 'animate-spin' : ''

  return (
    <>
      {documentType === 'core/article#timeless' && (
        <Button
          variant='outline'
          size='sm'
          disabled={isConverting}
          onClick={() => setToArticleOpen(true)}
        >
          <RefreshCwIcon size={14} strokeWidth={1.75} className={iconClassName} />
          {t('actions.convertToArticle')}
        </Button>
      )}
      {documentType === 'core/article' && (
        <Button
          variant='outline'
          size='sm'
          disabled={isConverting}
          onClick={() => setToTimelessOpen(true)}
        >
          <RefreshCwIcon size={14} strokeWidth={1.75} className={iconClassName} />
          {t('actions.convertToTimeless')}
        </Button>
      )}
      {toArticleOpen && (
        <ConvertToArticleDialog
          timelessId={ydoc.id}
          onClose={(result) => {
            setToArticleOpen(false)
            if (result?.articleId) {
              openEditor(undefined, { id: result.articleId })
            }
          }}
        />
      )}
      {toTimelessOpen && (
        <ConvertToTimelessDialog
          articleId={ydoc.id}
          onClose={(result) => {
            setToTimelessOpen(false)
            if (result?.timelessId) {
              openEditor(undefined, { id: result.timelessId })
            }
          }}
        />
      )}
    </>
  )
}
