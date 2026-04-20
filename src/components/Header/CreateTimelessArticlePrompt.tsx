import { type JSX, useState } from 'react'
import { Prompt } from '@/components'
import { TimelessCategorySelect } from '@/components/TimelessCategorySelect'
import { useSession } from 'next-auth/react'
import { useRegistry } from '@/hooks'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import type { Block } from '@ttab/elephant-api/newsdoc'
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@ttab/elephant-ui'
import { Newsvalues } from '@/defaults'
import { createNewTimelessArticle } from './lib/createNewTimelessArticle'

/**
 * Prompt for creating a new timeless article from the header "+ New" menu.
 * Mirrors the planning→timeless flow (`CreateDeliverablePrompt`): the schema
 * requires a `core/timeless-category` subject link, so the category must be
 * picked before the document is saved.
 */
export const CreateTimelessArticlePrompt = ({ id, onClose }: {
  id: string
  onClose: (id?: string) => void
}): JSX.Element => {
  const { repository } = useRegistry()
  const { data: session } = useSession()
  const { t } = useTranslation()
  const [title, setTitle] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<Block | undefined>()
  const [newsvalue, setNewsvalue] = useState<string>('3')
  const [isCreating, setIsCreating] = useState(false)

  const trimmedTitle = title.trim()

  const handleCreate = () => {
    if (isCreating || !selectedCategory || !trimmedTitle) {
      return
    }
    setIsCreating(true)
    createNewTimelessArticle(repository, session, id, trimmedTitle, selectedCategory, newsvalue)
      .then((newId) => onClose(newId))
      .catch((ex: unknown) => {
        const message = ex instanceof Error ? ex.message : t('errors:messages.unknown')
        console.error('Failed to create timeless article:', ex)
        toast.error(t('errors:toasts.creationFailed', { error: message }))
        setIsCreating(false)
      })
  }

  return (
    <Prompt
      title={t('views:timeless.actions.new')}
      primaryLabel={t('common:actions.create')}
      secondaryLabel={t('common:actions.abort')}
      disablePrimary={!selectedCategory || !trimmedTitle || isCreating}
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
    </Prompt>
  )
}
