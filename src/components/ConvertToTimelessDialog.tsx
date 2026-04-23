import { useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import type { Block } from '@ttab/elephant-api/newsdoc'
import { AlertCircleIcon, LoaderIcon } from '@ttab/elephant-ui/icons'
import { Prompt } from './Prompt'
import { TimelessCategorySelect } from './TimelessCategory'
import { useConvertArticleType } from '@/hooks/useConvertArticleType'

interface Props {
  articleId: string
  onClose: (result?: { timelessId: string }) => void
}

export const ConvertToTimelessDialog = ({ articleId, onClose }: Props): JSX.Element => {
  const { t } = useTranslation()
  const { convert, isConverting } = useConvertArticleType()
  const [category, setCategory] = useState<Block | undefined>()
  const [failed, setFailed] = useState(false)

  const handleConfirm = () => {
    if (!category) {
      return
    }
    setFailed(false)
    void convert(articleId, {
      targetType: 'core/article#timeless',
      category
    }).then((result) => {
      if (result.success && result.kind === 'timeless') {
        onClose({ timelessId: result.newDocumentId })
        return
      }
      setFailed(true)
    })
  }

  return (
    <Prompt
      title={t('metaSheet:actions.convertToTimeless')}
      description={t('metaSheet:convertToTimeless.description')}
      primaryLabel={t('common:actions.confirm')}
      secondaryLabel={t('common:actions.abort')}
      disablePrimary={!category || isConverting}
      onPrimary={handleConfirm}
      onSecondary={() => onClose()}
    >
      <div className='pt-2'>
        <TimelessCategorySelect value={category} onChange={setCategory} />
      </div>

      {isConverting && (
        <div className='flex items-center gap-2 text-sm text-muted-foreground pt-2'>
          <LoaderIcon size={14} strokeWidth={1.75} className='animate-spin' />
          {t('metaSheet:convertToArticle.converting')}
        </div>
      )}

      {failed && !isConverting && (
        <div className='flex items-center gap-2 text-sm text-destructive pt-2'>
          <AlertCircleIcon size={14} strokeWidth={1.75} />
          {t('metaSheet:convertToArticle.failed')}
        </div>
      )}
    </Prompt>
  )
}
