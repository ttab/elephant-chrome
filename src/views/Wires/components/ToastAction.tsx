import type { JSX } from 'react'
import { useLink } from '@/hooks/useLink'
import { Button, Tooltip } from '@ttab/elephant-ui'
import { CalendarDaysIcon, FileInputIcon } from '@ttab/elephant-ui/icons'
import { useTranslation } from 'react-i18next'

export const ToastAction = ({ planningId, articleId }: {
  planningId: string | undefined
  articleId: string | undefined
}): JSX.Element => {
  const { t } = useTranslation('wires')
  const openPlanning = useLink('Planning')
  const openArticle = useLink('Editor')

  return (
    <div className='flex flex-row w-full gap-2 justify-end'>
      {planningId && (
        <Tooltip content={t('toast.openPlanning')}>
          <Button
            variant='icon'
            className='text-muted-foreground'
            onClick={(event) => openPlanning(event, { id: planningId }, 'last')}
          >
            <CalendarDaysIcon size={16} strokeWidth={1.75} />
          </Button>
        </Tooltip>
      )}
      {articleId && (
        <Tooltip content={t('toast.openArticle')}>
          <Button
            variant='icon'
            onClick={(event) => openArticle(event, { id: articleId }, 'last')}
          >
            <FileInputIcon size={16} strokeWidth={1.75} />
          </Button>
        </Tooltip>
      )}
    </div>
  )
}
