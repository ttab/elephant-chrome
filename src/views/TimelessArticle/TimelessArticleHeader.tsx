import { type JSX } from 'react'
import { ViewHeader } from '@/components'
import { Button } from '@ttab/elephant-ui'
import { XIcon, SaveIcon } from '@ttab/elephant-ui/icons'
import { type YDocument, useYValue } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
import { snapshotDocument } from '@/lib/snapshotDocument'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

interface TimelessArticleHeaderProps {
  ydoc: YDocument<Y.Map<unknown>>
  asDialog: boolean
  onDialogClose?: (id?: string, title?: string) => void
}

export function TimelessArticleHeader({
  ydoc,
  asDialog,
  onDialogClose
}: TimelessArticleHeaderProps): JSX.Element {
  const [title] = useYValue<string | undefined>(ydoc.ele, 'root.title')
  const { t } = useTranslation(['common', 'shared', 'errors'])

  const handleSave = async () => {
    try {
      await snapshotDocument(ydoc.id, { force: true }, ydoc.provider?.document)
      toast.success('Document saved')
      onDialogClose?.(ydoc.id, title)
    } catch (error) {
      console.error('Failed to save timeless article:', error)
      toast.error(t('errors:toasts.savedDocumentFailed'))
    }
  }

  const handleClose = () => {
    onDialogClose?.()
  }

  return (
    <ViewHeader.Root asDialog={asDialog}>
      <ViewHeader.Content>
        <ViewHeader.Title
          name='TimelessArticle'
          title={title || t('shared:assignmentTypes.timeless')}
        />
      </ViewHeader.Content>

      <ViewHeader.Action>
        {asDialog && (
          <div className='flex gap-2'>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleClose}
            >
              <XIcon size={18} strokeWidth={1.75} />
              {t('common:actions.close')}
            </Button>
            <Button
              size='sm'
              onClick={() => void handleSave()}
            >
              <SaveIcon size={18} strokeWidth={1.75} />
              {t('common:actions.save')}
            </Button>
          </div>
        )}
      </ViewHeader.Action>
    </ViewHeader.Root>
  )
}
