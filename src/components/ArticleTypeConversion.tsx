import { type JSX, useState } from 'react'
import { Button } from '@ttab/elephant-ui'
import { RefreshCwIcon } from '@ttab/elephant-ui/icons'
import { useTranslation } from 'react-i18next'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
import { useConvertArticleType } from '@/hooks/useConvertArticleType'
import { useLink } from '@/hooks/useLink'
import { ConvertToArticleDialog } from './ConvertToArticleDialog'

/**
 * Convert button for article ↔ timeless article.
 * Timeless→article needs a target date + source planning (goes through
 * ConvertToArticleDialog); article→timeless is a one-click operation.
 */
export const ArticleTypeConversion = ({ ydoc, documentType }: {
  ydoc: YDocument<Y.Map<unknown>>
  documentType: string | undefined
}): JSX.Element | null => {
  const { t } = useTranslation('metaSheet')
  const { convert, isConverting } = useConvertArticleType()
  const openEditor = useLink('Editor')
  const [dialogOpen, setDialogOpen] = useState(false)

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
          onClick={() => setDialogOpen(true)}
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
          onClick={() => void convert(ydoc.id, { targetType: 'core/article#timeless' })}
        >
          <RefreshCwIcon size={14} strokeWidth={1.75} className={iconClassName} />
          {t('actions.convertToTimeless')}
        </Button>
      )}
      {dialogOpen && (
        <ConvertToArticleDialog
          timelessId={ydoc.id}
          onClose={(result) => {
            setDialogOpen(false)
            if (result?.articleId) {
              openEditor(undefined, { id: result.articleId })
            }
          }}
        />
      )}
    </>
  )
}
