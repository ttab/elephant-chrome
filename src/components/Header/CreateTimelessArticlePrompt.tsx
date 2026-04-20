import { type JSX, useCallback, useState } from 'react'
import { Prompt } from '@/components'
import { TimelessCategorySelect } from '@/components/TimelessCategorySelect'
import { useSession } from 'next-auth/react'
import { useRegistry, useSections } from '@/hooks'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import type { Block } from '@ttab/elephant-api/newsdoc'
import {
  Button,
  ComboBox,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@ttab/elephant-ui'
import { CircleXIcon } from '@ttab/elephant-ui/icons'
import { Newsvalues } from '@/defaults'
import { convertToISOStringInTimeZone } from '@/shared/datetime'
import { fetch as fetchPlannings } from '@/lib/index/fetch-plannings-twirp'
import { addAssignmentWithDeliverable } from '@/lib/index/addAssignment'
import { createNewTimelessArticle } from './lib/createNewTimelessArticle'

interface PlanningOption {
  value: string
  label: string
  payload: {
    slugline?: string
    section?: string
  }
}

/**
 * Prompt for creating a new timeless article from the header "+ New" menu.
 * Every timeless needs a planning that owns it as a deliverable — the user
 * either picks an existing planning (the timeless gets appended as an
 * assignment) or creates a new one (slugline + section required).
 */
export const CreateTimelessArticlePrompt = ({ id, onClose }: {
  id: string
  onClose: (id?: string) => void
}): JSX.Element => {
  const { repository, index, locale, timeZone } = useRegistry()
  const { data: session } = useSession()
  const { t } = useTranslation()
  const sections = useSections({ sort: 'title' })

  const [title, setTitle] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<Block | undefined>()
  const [newsvalue, setNewsvalue] = useState<string>('3')
  const [selectedPlanning, setSelectedPlanning] = useState<PlanningOption | undefined>()
  const [slugline, setSlugline] = useState<string>('')
  const [sectionId, setSectionId] = useState<string>('')
  const [isCreating, setIsCreating] = useState(false)

  const trimmedTitle = title.trim()
  const trimmedSlugline = slugline.trim()
  const isNewPlanning = !selectedPlanning
  const canCreate = !!trimmedTitle
    && !!selectedCategory
    && (isNewPlanning ? (!!trimmedSlugline && !!sectionId) : true)
    && !isCreating

  const handleCreate = () => {
    // Second selectedCategory check is for TS narrowing — canCreate already guards it.
    if (!canCreate || !selectedCategory) {
      return
    }
    setIsCreating(true)

    const now = new Date()
    const localDate = convertToISOStringInTimeZone(now, timeZone).slice(0, 10)
    const isoDateTime = `${now.toISOString().split('.')[0]}Z`

    const planningContext = selectedPlanning
      ? { planningId: selectedPlanning.value, slugline: selectedPlanning.payload.slugline }
      : (() => {
          const section = sections.find((s) => s.id === sectionId)
          return {
            planningId: undefined,
            planningTitle: trimmedTitle,
            slugline: trimmedSlugline,
            priority: Number(newsvalue),
            section: section ? { uuid: section.id, title: section.title } : undefined
          }
        })()

    createNewTimelessArticle(repository, session, id, trimmedTitle, selectedCategory, newsvalue)
      .then(async (newId) => {
        const updatedPlanningId = await addAssignmentWithDeliverable({
          ...planningContext,
          type: 'timeless',
          deliverableId: newId,
          title: trimmedTitle,
          publicVisibility: true,
          localDate,
          isoDateTime
        })
        if (!updatedPlanningId) {
          throw new Error('Planning link failed')
        }
        onClose(newId)
      })
      .catch((ex: unknown) => {
        const message = ex instanceof Error ? ex.message : t('errors:messages.unknown')
        console.error('Failed to create timeless article:', ex)
        toast.error(t('errors:toasts.creationFailed', { error: message }))
        setIsCreating(false)
      })
  }

  const fetchPlanningOptions = useCallback(
    (query: string) => fetchPlannings(
      query,
      session,
      t,
      index,
      locale,
      timeZone,
      { searchOlder: true, sluglines: true }
    ),
    [session, t, index, locale, timeZone]
  )

  return (
    <Prompt
      title={t('views:timeless.actions.new')}
      primaryLabel={t('common:actions.create')}
      secondaryLabel={t('common:actions.abort')}
      disablePrimary={!canCreate}
      onPrimary={handleCreate}
      onSecondary={() => onClose()}
    >
      <div className='flex flex-col gap-2'>
        <Label className='text-sm text-muted-foreground'>
          {t('core:labels.title')}
        </Label>
        <Input
          autoFocus
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>

      <div className='grid grid-cols-3 gap-3'>
        <div className='col-span-2'>
          <TimelessCategorySelect
            value={selectedCategory}
            onChange={setSelectedCategory}
          />
        </div>
        <div className='col-span-1 flex flex-col gap-2'>
          <Label className='text-sm text-muted-foreground'>
            {t('core:labels.newsvalue')}
          </Label>
          <Select value={newsvalue} onValueChange={setNewsvalue}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Newsvalues.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='flex flex-col gap-2'>
        <Label className='text-sm text-muted-foreground'>
          {t('planning:move.pickPlanning')}
        </Label>
        <div className='flex gap-2 items-center'>
          <ComboBox
            max={1}
            size='xs'
            className='min-w-0 w-full truncate justify-start'
            selectedOptions={selectedPlanning ? [selectedPlanning] : []}
            placeholder={t('planning:move.pickPlanning')}
            fetch={fetchPlanningOptions}
            minSearchChars={2}
            modal={true}
            onSelect={(option) => {
              if (option.value === selectedPlanning?.value) {
                setSelectedPlanning(undefined)
                return
              }
              setSelectedPlanning({
                value: option.value,
                label: option.label,
                payload: option.payload as PlanningOption['payload']
              })
            }}
            translationStrings={{
              nothingFound: t('common:misc.nothingFound'),
              searching: t('common:misc.searching')
            }}
          />
          {!!selectedPlanning && (
            <Button
              variant='ghost'
              className='text-muted-foreground flex h-7 w-7 p-0'
              onClick={(e) => {
                e.preventDefault()
                setSelectedPlanning(undefined)
              }}
            >
              <CircleXIcon size={18} strokeWidth={1.75} />
            </Button>
          )}
        </div>
      </div>

      {isNewPlanning && (
        <div className='grid grid-cols-2 gap-3'>
          <div className='flex flex-col gap-2'>
            <Label className='text-sm text-muted-foreground'>
              {t('core:labels.slugline')}
            </Label>
            <Input
              value={slugline}
              onChange={(event) => setSlugline(event.target.value)}
            />
          </div>
          <div className='flex flex-col gap-2'>
            <Label className='text-sm text-muted-foreground'>
              {t('core:labels.section')}
            </Label>
            <Select value={sectionId} onValueChange={setSectionId}>
              <SelectTrigger>
                <SelectValue placeholder={t('event:placeholders.addSection')} />
              </SelectTrigger>
              <SelectContent>
                {sections.map((sec) => (
                  <SelectItem key={sec.id} value={sec.id}>
                    {sec.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </Prompt>
  )
}
