import { useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Calendar,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@ttab/elephant-ui'
import { CalendarIcon, LoaderIcon } from '@ttab/elephant-ui/icons'
import { format } from 'date-fns'
import { Prompt } from './Prompt'
import { useConvertArticleType } from '@/hooks/useConvertArticleType'
import { useDeliverablePlanningId } from '@/hooks/index/useDeliverablePlanningId'
import { useRegistry } from '@/hooks/useRegistry'

interface ConversionPayload {
  articleId: string
  planningId: string
}

interface Props {
  timelessId: string
  onClose: (result?: ConversionPayload) => void
}

export function ConvertToArticleDialog({ timelessId, onClose }: Props): JSX.Element {
  const { t } = useTranslation()
  const { locale } = useRegistry()
  const { convert, isConverting } = useConvertArticleType()
  const sourcePlanningId = useDeliverablePlanningId(timelessId)
  const [targetDate, setTargetDate] = useState<Date>(() => new Date())

  const formattedTarget = format(targetDate, 'yyyy-MM-dd')

  const handleConfirm = () => {
    void convert(timelessId, 'core/article', {
      targetDate: formattedTarget,
      sourcePlanningId: sourcePlanningId || undefined
    }).then((result) => {
      if (result.success && result.newDocumentId && result.newPlanningId) {
        onClose({
          articleId: result.newDocumentId,
          planningId: result.newPlanningId
        })
      }
    })
  }

  return (
    <Prompt
      title={t('metaSheet:actions.convertToArticle')}
      description={sourcePlanningId
        ? t('metaSheet:convertToArticle.descriptionWithPlanning')
        : t('metaSheet:convertToArticle.descriptionNoPlanning')}
      primaryLabel={t('common:actions.confirm')}
      secondaryLabel={t('common:actions.abort')}
      disablePrimary={isConverting}
      onPrimary={handleConfirm}
      onSecondary={() => onClose()}
    >
      <div className='flex flex-col gap-2 pt-2'>
        <Label>{t('metaSheet:convertToArticle.targetDateLabel')}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant='outline' className='w-full justify-start gap-2'>
              <CalendarIcon size={16} strokeWidth={1.75} />
              {format(targetDate, 'EEEE yyyy-MM-dd', { locale: locale.module })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-auto p-0' align='start'>
            <Calendar
              mode='single'
              selected={targetDate}
              defaultMonth={targetDate}
              locale={locale.module}
              onSelect={(selected) => {
                if (selected) {
                  setTargetDate(selected)
                }
              }}
            />
          </PopoverContent>
        </Popover>

        {isConverting && (
          <div className='flex items-center gap-2 text-sm text-muted-foreground pt-2'>
            <LoaderIcon size={14} strokeWidth={1.75} className='animate-spin' />
            {t('metaSheet:convertToArticle.converting')}
          </div>
        )}
      </div>
    </Prompt>
  )
}
