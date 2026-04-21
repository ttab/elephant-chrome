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
import { AlertCircleIcon, CalendarIcon, LoaderIcon } from '@ttab/elephant-ui/icons'
import { format } from 'date-fns'
import { QueryV1, TermQueryV1 } from '@ttab/elephant-api/index'
import { Prompt } from './Prompt'
import { useConvertArticleType } from '@/hooks/useConvertArticleType'
import { useDocuments } from '@/hooks/index/useDocuments'
import { useRegistry } from '@/hooks/useRegistry'
import type { Planning, PlanningFields } from '@/shared/schemas/planning'

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
  const [targetDate, setTargetDate] = useState<Date>(() => new Date())
  const [failed, setFailed] = useState(false)

  const { data: plannings, isLoading: planningLoading } = useDocuments<Planning, PlanningFields>({
    documentType: 'core/planning-item',
    query: QueryV1.create({
      conditions: {
        oneofKind: 'term',
        term: TermQueryV1.create({
          field: 'document.meta.core_assignment.rel.deliverable.uuid',
          value: timelessId
        })
      }
    }),
    fields: []
  })
  const sourcePlanningId = plannings?.[0]?.id

  const formattedTarget = format(targetDate, 'yyyy-MM-dd')

  const handleConfirm = () => {
    if (!sourcePlanningId) {
      return
    }
    setFailed(false)
    void convert(timelessId, {
      targetType: 'core/article',
      targetDate: formattedTarget,
      sourcePlanningId
    }).then((result) => {
      if (result.success && result.kind === 'article') {
        onClose({
          articleId: result.newDocumentId,
          planningId: result.newPlanningId
        })
        return
      }
      setFailed(true)
    })
  }

  const descriptionKey = planningLoading
    ? 'metaSheet:convertToArticle.loadingPlanning'
    : sourcePlanningId
      ? 'metaSheet:convertToArticle.descriptionWithPlanning'
      : 'metaSheet:convertToArticle.descriptionNoPlanning'

  return (
    <Prompt
      title={t('metaSheet:actions.convertToArticle')}
      description={t(descriptionKey)}
      primaryLabel={isConverting
        ? (
            <span className='inline-flex items-center gap-2'>
              <LoaderIcon size={14} strokeWidth={1.75} className='animate-spin' />
              {t('metaSheet:convertToArticle.converting')}
            </span>
          )
        : t('common:actions.confirm')}
      secondaryLabel={t('common:actions.abort')}
      disablePrimary={isConverting || planningLoading || !sourcePlanningId}
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

        {failed && !isConverting && (
          <div className='flex items-center gap-2 text-sm text-destructive pt-2'>
            <AlertCircleIcon size={14} strokeWidth={1.75} />
            {t('metaSheet:convertToArticle.failed')}
          </div>
        )}
      </div>
    </Prompt>
  )
}
