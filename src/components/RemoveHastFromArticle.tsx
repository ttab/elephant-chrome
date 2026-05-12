import { Button } from '@ttab/elephant-ui'
import type { Block } from '@ttab/elephant-api/newsdoc'
import type { YDocument } from '@/modules/yjs/hooks'
import { useYValue } from '@/modules/yjs/hooks'
import { useRegistry } from '@/hooks/useRegistry'
import { useTranslation } from 'react-i18next'
import { ZapOffIcon } from '@ttab/elephant-ui/icons'
import type * as Y from 'yjs'
import { useState, type JSX } from 'react'
import { snapshotDocument } from '@/lib/snapshotDocument'
import { toast } from 'sonner'
import { mutate } from 'swr'
import { Prompt } from '@/components/Prompt'

export function RemoveHastFromArticle({ ydoc, documentType }: {
  ydoc: YDocument<Y.Map<unknown>>
  documentType?: string
}): JSX.Element | null {
  const { featureFlags } = useRegistry()
  const { t } = useTranslation()
  const [hast, setHast] = useYValue<Block | undefined>(ydoc.ele, 'meta.ntb/hast[0]')
  const [showPrompt, setShowPrompt] = useState(false)

  const isTimeless = documentType === 'core/article#timeless'

  if (!featureFlags.hasHast || !hast) {
    return null
  }

  async function handleRemove() {
    try {
      setHast(undefined)
      await snapshotDocument(ydoc.id, {}, ydoc.provider?.document)
      void mutate(
        (key) => Array.isArray(key) && key[0] === 'hast-indicator' && key[1] === ydoc.id
      )
      setShowPrompt(false)
    } catch (error) {
      toast.error(t('errors:toasts.saveChangeError'))
      console.error('Error removing HAST from article:', error)
    }
  }

  return (
    <>
      <Button
        variant='outline'
        size='sm'
        className='gap-1.5 text-muted-foreground'
        onClick={() => setShowPrompt(true)}
      >
        <ZapOffIcon size={15} strokeWidth={1.75} />
        {isTimeless
          ? t('metaSheet:actions.removeHastFromTimeless')
          : t('metaSheet:actions.removeHastFromArticle')}
      </Button>

      {showPrompt && (
        <Prompt
          title={isTimeless
            ? t('metaSheet:removeHastPromptTimeless.title')
            : t('metaSheet:removeHastPrompt.title')}
          description={isTimeless
            ? t('metaSheet:removeHastPromptTimeless.description')
            : t('metaSheet:removeHastPrompt.description')}
          primaryLabel={t('metaSheet:removeHastPrompt.confirm')}
          cancelLabel={t('common:actions.abort')}
          onPrimary={() => void handleRemove()}
          onCancel={() => setShowPrompt(false)}
        />
      )}
    </>
  )
}
