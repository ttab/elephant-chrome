import { type JSX } from 'react'
import { Button } from '@ttab/elephant-ui'
import { RefreshCwIcon } from '@ttab/elephant-ui/icons'
import { useTranslation } from 'react-i18next'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
import { useConvertArticleType } from '@/hooks/useConvertArticleType'
import { useLink } from '@/hooks/useLink'
import { useModal } from '@/components/Modal/useModal'
import { useWorkflowStatus } from '@/hooks/useWorkflowStatus'
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
  const [status] = useWorkflowStatus({ documentId: ydoc.id })
  const isPublished = status?.checkpoint === 'usable'

  if (documentType !== 'core/article' && documentType !== 'core/article#timeless') {
    return null
  }

  const iconClassName = isConverting ? 'animate-spin' : ''

  const openToArticle = () => {
    showModal(
      <ConvertToArticleDialog
        timelessId={ydoc.id}
        timelessDoc={ydoc.provider?.document}
        onClose={(result) => {
          hideModal()
          if (result?.articleId) {
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
          className='gap-1.5 text-muted-foreground'
          disabled={isConverting}
          onClick={openToArticle}
        >
          <RefreshCwIcon size={14} strokeWidth={1.75} className={iconClassName} />
          {t('actions.convertToArticle')}
        </Button>
      )}
      {documentType === 'core/article' && (
        <span
          title={isPublished ? t('convertToTimeless.publishedDisabled') : undefined}
          className='inline-flex'
        >
          <Button
            variant='outline'
            size='sm'
            className='gap-1.5 text-muted-foreground w-full'
            disabled={isConverting || isPublished}
            onClick={openToTimeless}
          >
            <RefreshCwIcon size={14} strokeWidth={1.75} className={iconClassName} />
            {t('actions.convertToTimeless')}
          </Button>
        </span>
      )}
    </>
  )
}
