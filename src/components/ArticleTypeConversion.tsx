import { type JSX } from 'react'
import { Button } from '@ttab/elephant-ui'
import { RefreshCwIcon } from '@ttab/elephant-ui/icons'
import { useTranslation } from 'react-i18next'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
import { useConvertArticleType } from '@/hooks/useConvertArticleType'
import { useLink } from '@/hooks/useLink'
import { useModal } from '@/components/Modal/useModal'
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
  const { showModal, hideModal } = useModal()
  const openEditor = useLink('Editor')

  if (documentType !== 'core/article' && documentType !== 'core/article#timeless') {
    return null
  }

  const iconClassName = isConverting ? 'animate-spin' : ''

  const openToArticle = () => {
    showModal(
      <ConvertToArticleDialog
        timelessId={ydoc.id}
        onClose={(result) => {
          hideModal()
          if (result?.articleId) {
            // Replace the source slot in-place so the new article appears
            // where the timeless was — the source is now `used` and
            // shouldn't keep its slot.
            openEditor(undefined, { id: result.articleId }, 'self')
          }
        }}
      />
    )
  }

  const openToTimeless = () => {
    showModal(
      <ConvertToTimelessDialog
        articleId={ydoc.id}
        onClose={(result) => {
          hideModal()
          if (result?.timelessId) {
            openEditor(undefined, { id: result.timelessId }, 'self')
          }
        }}
      />
    )
  }

  return (
    <>
      {documentType === 'core/article#timeless' && (
        <Button
          variant='outline'
          size='sm'
          disabled={isConverting}
          onClick={openToArticle}
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
          onClick={openToTimeless}
        >
          <RefreshCwIcon size={14} strokeWidth={1.75} className={iconClassName} />
          {t('actions.convertToTimeless')}
        </Button>
      )}
    </>
  )
}
