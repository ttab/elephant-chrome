import { type JSX, useCallback, useMemo, useState } from 'react'
import { CategoryPicker } from '@/components/TimelessCategory'
import { useSession } from 'next-auth/react'
import { useRegistry, useSections } from '@/hooks'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import type { Block } from '@ttab/elephant-api/newsdoc'
import { Button, Checkbox, ComboBox, Input, Label } from '@ttab/elephant-ui'
import {
  BookmarkIcon,
  BriefcaseBusinessIcon,
  CircleXIcon,
  GanttChartSquareIcon,
  TagIcon
} from '@ttab/elephant-ui/icons'
import { View, ViewHeader } from '@/components/View'
import { Form } from '@/components/Form'
import { UserMessage } from '@/components/UserMessage'
import { Newsvalues } from '@/defaults'
import { convertToISOStringInTimeZone } from '@/shared/datetime'
import { fetch as fetchPlannings } from '@/lib/index/fetch-plannings-twirp'
import { addAssignmentWithDeliverable } from '@/lib/index/addAssignment'
import type { DefaultValueOption } from '@/types'
import { createNewTimelessArticle } from './lib/createNewTimelessArticle'

type PlanningOption = Omit<DefaultValueOption, 'payload'> & {
  payload: { slugline?: string, section?: string }
}

/**
 * Dialog view for creating a new timeless article from the header "+ New"
 * menu. Every timeless needs a planning that owns it as a deliverable — the
 * user either picks an existing planning (the timeless gets appended as an
 * assignment) or creates a new one (slugline + section required).
 */
export const TimelessCreation = ({ id, onClose }: {
  id: string
  onClose: (id?: string) => void
}): JSX.Element => {
  const { repository, index, locale, timeZone } = useRegistry()
  const { data: session } = useSession()
  const { t } = useTranslation()
  const sections = useSections({ sort: 'title' })

  const [title, setTitle] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<Block | undefined>()
  const [newsvalue, setNewsvalue] = useState<string | undefined>(undefined)
  const [selectedPlanning, setSelectedPlanning] = useState<PlanningOption | undefined>()
  const [slugline, setSlugline] = useState<string>('')
  const [sectionId, setSectionId] = useState<string>('')
  const [searchOlder, setSearchOlder] = useState(false)

  const trimmedTitle = title.trim()
  const trimmedSlugline = slugline.trim()
  const isNewPlanning = !selectedPlanning
  const canCreate = !!trimmedTitle
    && !!selectedCategory
    && !!newsvalue
    && (isNewPlanning ? (!!trimmedSlugline && !!sectionId) : true)

  const sectionOptions = useMemo(
    () => sections.map((s) => ({ value: s.id, label: s.title })),
    [sections]
  )
  const selectedSectionOptions = useMemo(
    () => sectionOptions.filter((o) => o.value === sectionId),
    [sectionOptions, sectionId]
  )
  const selectedNewsvalueOptions = useMemo(
    () => Newsvalues.filter((o) => o.value === newsvalue),
    [newsvalue]
  )
  const SelectedNewsvalueIcon = selectedNewsvalueOptions[0]?.icon

  const handleCreate = async (): Promise<void> => {
    if (!canCreate || !selectedCategory || !newsvalue) {
      return
    }

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

    try {
      const newId = await createNewTimelessArticle(
        repository, session, id, trimmedTitle, selectedCategory, newsvalue
      )
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
    } catch (ex) {
      const message = ex instanceof Error ? ex.message : t('errors:messages.unknown')
      console.error('Failed to create timeless article:', ex)
      toast.error(t('errors:toasts.creationFailed', { error: message }))
      throw ex
    }
  }

  const fetchPlanningOptions = useCallback(
    (query: string) => fetchPlannings(
      query,
      session,
      t,
      index,
      locale,
      timeZone,
      { searchOlder, sluglines: true }
    ),
    [session, t, index, locale, timeZone, searchOlder]
  )

  return (
    <View.Root asDialog>
      <ViewHeader.Root asDialog>
        <ViewHeader.Title
          name='Timeless'
          title={t('views:timeless.actions.new')}
          icon={BookmarkIcon}
          iconColor='#7C6F9C'
          asDialog
        />
        <ViewHeader.Content />
        <ViewHeader.Action asDialog onDialogClose={() => onClose()} />
      </ViewHeader.Root>

      <View.Content>
        <Form.Root asDialog>
          <Form.Content>
            <Form.Group icon={BriefcaseBusinessIcon}>
              <>
                <Input
                  autoFocus
                  className='pt-2 h-7 text-medium placeholder:text-[#5D709F] placeholder-shown:border-[#5D709F] placeholder-shown:bg-[#5D709F]/5'
                  placeholder={`${t('common:actions.add')} ${t('core:labels.title').toLocaleLowerCase()}`}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </>
            </Form.Group>

            <Form.Group icon={BookmarkIcon}>
              <>
                <CategoryPicker
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  asDialog
                  validation
                />
              </>

              <ComboBox
                max={1}
                size='xs'
                modal={true}
                variant='outline'
                validation
                options={Newsvalues}
                selectedOptions={selectedNewsvalueOptions}
                placeholder={`${t('common:actions.add')} ${t('core:labels.newsvalue').toLocaleLowerCase()}`}
                onSelect={(option) => {
                  if (newsvalue !== option.value) {
                    setNewsvalue(option.value)
                  }
                }}
                translationStrings={{
                  nothingFound: t('common:misc.nothingFound'),
                  searching: t('common:misc.searching')
                }}
              >
                {selectedNewsvalueOptions[0] && SelectedNewsvalueIcon && (
                  <div className='flex'>
                    <SelectedNewsvalueIcon {...selectedNewsvalueOptions[0].iconProps} />
                    {selectedNewsvalueOptions[0].label}
                  </div>
                )}
              </ComboBox>
            </Form.Group>

            <Form.Group icon={GanttChartSquareIcon}>
              <ComboBox
                max={1}
                size='xs'
                modal={true}
                className='min-w-0 w-full truncate justify-start max-w-48'
                selectedOptions={selectedPlanning ? [selectedPlanning] : []}
                placeholder={t('planning:move.pickPlanning')}
                fetch={fetchPlanningOptions}
                minSearchChars={2}
                fetchDebounce={300}
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
                  asChild
                  className='text-muted-foreground flex size-4 p-0 data-[state=open]:bg-muted hover:bg-accent2'
                  onClick={(e) => {
                    e.preventDefault()
                    setSelectedPlanning(undefined)
                  }}
                >
                  <CircleXIcon size={18} strokeWidth={1.75} />
                </Button>
              )}

              <Checkbox
                id='TimelessSearchOlder'
                checked={searchOlder}
                onCheckedChange={(checked: boolean) => setSearchOlder(checked)}
              />
              <Label htmlFor='TimelessSearchOlder' className='text-muted-foreground'>
                {t('wires:creation.showOlder')}
              </Label>
            </Form.Group>

            {isNewPlanning && (
              <Form.Group icon={TagIcon}>
                <>
                  <Input
                    className='pt-2 h-7 max-w-48 text-medium placeholder:text-[#5D709F] placeholder-shown:border-[#5D709F] placeholder-shown:bg-[#5D709F]/5'
                    placeholder={`${t('common:actions.add')} ${t('core:labels.slugline').toLocaleLowerCase()}`}
                    value={slugline}
                    onChange={(event) => setSlugline(event.target.value)}
                  />
                </>

                <ComboBox
                  max={1}
                  size='xs'
                  modal={true}
                  sortOrder='label'
                  variant='outline'
                  validation
                  options={sectionOptions}
                  selectedOptions={selectedSectionOptions}
                  placeholder={t('event:placeholders.addSection')}
                  onSelect={(option) => {
                    setSectionId(sectionId === option.value ? '' : option.value)
                  }}
                  translationStrings={{
                    nothingFound: t('common:misc.nothingFound'),
                    searching: t('common:misc.searching')
                  }}
                />
              </Form.Group>
            )}

            <UserMessage asDialog>
              {isNewPlanning
                ? t('wires:creation.noPlanningHint')
                : t('wires:creation.withPlanningHint')}
            </UserMessage>
          </Form.Content>

          <Form.Footer className='flex justify-between flex-row-reverse'>
            <Form.Submit onSubmit={handleCreate} disableOnSubmit>
              <Button type='submit' disabled={!canCreate}>
                {t('views:timeless.actions.new')}
              </Button>
            </Form.Submit>
          </Form.Footer>
        </Form.Root>
      </View.Content>
    </View.Root>
  )
}
