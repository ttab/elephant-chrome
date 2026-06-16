import { useEffect, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Calendar,
  ComboBox,
  Checkbox,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@ttab/elephant-ui'
import {
  AlertCircleIcon,
  CalendarIcon,
  CircleXIcon,
  GanttChartSquareIcon,
  LoaderIcon
} from '@ttab/elephant-ui/icons'
import { format } from 'date-fns'
import { QueryV1, TermQueryV1 } from '@ttab/elephant-api/index'
import { useSession } from 'next-auth/react'
import { Prompt } from './Prompt'
import { useConvertArticleType } from '@/hooks/useConvertArticleType'
import { useDocuments } from '@/hooks/index/useDocuments'
import { useRegistry } from '@/hooks/useRegistry'
import { fetch } from '@/lib/index/fetch-plannings-twirp'
import type { Planning, PlanningFields } from '@/shared/schemas/planning'
import type * as Y from 'yjs'

interface ConversionPayload {
  articleId: string
  planningId: string
}

interface Props {
  timelessId: string
  timelessDoc?: Y.Doc
  onClose: (result?: ConversionPayload) => void
}

export const ConvertToArticleDialog = (
  { timelessId, timelessDoc, onClose }: Props
): JSX.Element => {
  const { t } = useTranslation()
  const { data: session } = useSession()
  const { locale, index, timeZone } = useRegistry()
  const { convert, isConverting } = useConvertArticleType()
  const [targetDate, setTargetDate] = useState<Date>(() => new Date())
  const [failed, setFailed] = useState(false)
  const [searchOlder, setSearchOlder] = useState(false)
  const [planningTouched, setPlanningTouched] = useState(false)
  const [selectedPlanning, setSelectedPlanning]
    = useState<{ value: string, label: string } | undefined>(undefined)

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
    fields: ['document.title']
  })

  const sourcePlanning = plannings?.[0]
  const sourcePlanningId = sourcePlanning?.id
  const sourcePlanningTitle = sourcePlanning?.fields?.['document.title']?.values?.[0]

  // Pre-select the planning the timeless currently lives in, until the editor
  // touches the picker so a deliberate clear/change is not overwritten.
  useEffect(() => {
    if (!planningTouched && !selectedPlanning && sourcePlanningId) {
      setSelectedPlanning({
        value: sourcePlanningId,
        label: sourcePlanningTitle || sourcePlanningId
      })
    }
  }, [planningTouched, selectedPlanning, sourcePlanningId, sourcePlanningTitle])

  const formattedTarget = format(targetDate, 'yyyy-MM-dd')

  const handleConfirm = () => {
    setFailed(false)
    void convert(timelessId, {
      targetType: 'core/article',
      targetDate: formattedTarget,
      targetPlanningId: selectedPlanning?.value,
      sourceDocument: timelessDoc
    }).then((result) => {
      if (result.success && result.kind === 'article') {
        onClose({ articleId: result.newDocumentId, planningId: result.newPlanningId })
        return
      }
      setFailed(true)
    }).catch((err: unknown) => {
      console.error('ConvertToArticleDialog: convert rejected', err)
      setFailed(true)
    })
  }

  return (
    <Prompt
      title={t('metaSheet:actions.convertToArticle')}
      description={t('metaSheet:convertToArticle.descriptionPickPlanning')}
      primaryLabel={isConverting
        ? (
            <>
              <LoaderIcon size={14} strokeWidth={1.75} className='animate-spin mr-1' />
              {t('metaSheet:convertToArticle.converting')}
            </>
          )
        : t('common:actions.confirm')}
      secondaryLabel={t('common:actions.abort')}
      disablePrimary={isConverting || planningLoading}
      onPrimary={handleConfirm}
      onSecondary={() => onClose()}
    >
      <div className='flex flex-col gap-2 pt-2'>
        <div className='flex items-center gap-2'>
          <GanttChartSquareIcon
            size={18}
            strokeWidth={1.75}
            className='text-muted-foreground shrink-0'
          />
          <ComboBox
            max={1}
            size='sm'
            className='min-w-0 grow justify-start truncate'
            modal
            minSearchChars={2}
            selectedOptions={selectedPlanning ? [selectedPlanning] : []}
            placeholder={t('planning:move.pickPlanning')}
            fetch={(query) => fetch(query, session, t, index, locale, timeZone, { searchOlder })}
            onSelect={(option) => {
              setPlanningTouched(true)
              setSelectedPlanning((current) =>
                current?.value === option.value
                  ? undefined
                  : { value: option.value, label: option.label })
            }}
            translationStrings={{
              nothingFound: t('common:misc.nothingFound'),
              searching: t('common:misc.searching')
            }}
          />
          {!!selectedPlanning && (
            <Button
              variant='ghost'
              aria-label={t('metaSheet:convertToArticle.clearPlanning')}
              className='text-muted-foreground flex h-7 w-7 p-0 shrink-0 hover:bg-accent2'
              onClick={(e) => {
                e.preventDefault()
                setPlanningTouched(true)
                setSelectedPlanning(undefined)
              }}
            >
              <CircleXIcon size={18} strokeWidth={1.75} />
            </Button>
          )}
        </div>

        <div className='flex items-center gap-2'>
          <Checkbox
            id='ConvertSearchOlder'
            checked={searchOlder}
            onCheckedChange={(checked: boolean) => { setSearchOlder(checked) }}
          />
          <Label htmlFor='ConvertSearchOlder' className='text-muted-foreground'>
            {t('core:labels.showOlder')}
          </Label>
        </div>

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
