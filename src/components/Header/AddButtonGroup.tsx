import { Button } from '@ttab/elephant-ui'
import { PlusIcon, ChevronDownIcon, type LucideIcon } from '@ttab/elephant-ui/icons'
import * as Views from '@/views'
import { getTemplateFromView } from '@/shared/templates/lib/getTemplateFromView'
import { cn } from '@ttab/elephant-ui/utils'
import type { View } from '@/types/index'
import { useModal } from '../Modal/useModal'
import {
  ButtonGroup,
  ButtonGroupSeparator,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@ttab/elephant-ui'
import { addButtonGroupValueFormat } from '@/defaults/documentTypeFormats'
import type { buttonVariants } from '@ttab/elephant-ui'
import type { VariantProps } from 'class-variance-authority'
import type { QueryParams } from '@/hooks/useQuery'
import { useLink } from '@/hooks/useLink'
import { useRegistry } from '@/hooks/useRegistry'
import { useSession } from 'next-auth/react'
import { createNewTimelessArticle } from './lib/createNewTimelessArticle'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'

const addButtonTypes = ['core/planning-item', 'core/event', 'core/article', 'core/factbox', 'core/flash', 'core/article#timeless'] as const

type Variant = VariantProps<typeof buttonVariants>['variant']
type ButtonView = { name: View, type: string, icon?: { icon?: LucideIcon, color?: string } }

const AddButton = ({
  withNew,
  variant = 'default',
  className,
  hast,
  view,
  onClick,
  t
}: {
  withNew?: boolean
  variant?: Variant
  className?: string
  hast?: boolean
  view: ButtonView
  onClick: (view: ButtonView) => void
  t: TFunction
}) => {
  const typeLabel = (t?: string) => t ? addButtonGroupValueFormat[t].label : ''

  return (
    <Button
      size='sm'
      variant={variant}
      className={!withNew ? '' : cn('h-8 pr-4', className)}
      onClick={() => onClick(view)}
    >
      {withNew && <PlusIcon size={18} strokeWidth={1.75} />}
      <span className='pl-0.5'>{`${withNew ? t('common:misc.new') : view.name === 'Flash' && hast ? 'HAST' : typeLabel(view.type)}`}</span>
    </Button>
  )
}

export const AddButtonGroup = ({ docType = 'core/planning-item', query }: { type: View, query: QueryParams, docType?: string }) => {
  const { showModal, hideModal } = useModal()
  const { repository, featureFlags } = useRegistry()
  const openTimelessArticle = useLink('TimelessArticle')
  const { data: session } = useSession()
  const { t } = useTranslation()
  const hasHast = !!featureFlags.hasHast

  const views: ButtonView[] = addButtonTypes.map((type) => {
    const format = addButtonGroupValueFormat[type]
    return { name: format.key as View, type, icon: { icon: format.icon, color: format.color, label: format.label } }
  })

  const firstItem = views.find((view) => view.type === docType) as ButtonView
  const ItemIcon = firstItem.icon

  const handleCreate = (view: ButtonView) => {
    const ViewDialog = Views[view.name]
    const id = crypto.randomUUID()

    if (view.name === 'TimelessArticle') {
      createNewTimelessArticle(repository, session, id)
        .then((id) => openTimelessArticle(undefined, { id }, undefined))
        .catch((error: unknown) => {
          console.error('Error creating timeless article:', error)
          toast.error((error as Error).message)
        })
    } else if (showModal) {
      const initialDocument = getTemplateFromView(view.name, { useHast: hasHast })(id, { query })
      showModal(
        <ViewDialog
          onDialogClose={hideModal}
          asDialog
          id={id}
          document={initialDocument}
        />
      )
    }
  }

  return (
    <ButtonGroup>
      <AddButton
        t={t}
        withNew
        view={firstItem?.type ? firstItem : views[0]}
        onClick={handleCreate}
      />
      <ButtonGroupSeparator />
      <DropdownMenu>
        <div>
          <DropdownMenuTrigger
            asChild
            className='h-full rounded-br-md rounded-tr-md bg-primary hover:bg-primary/90 cursor-pointer transition-all'
          >
            <div className='px-1.5'>
              <ChevronDownIcon size={14} strokeWidth={1.75} className='self-center h-full text-white dark:text-black' />
            </div>
          </DropdownMenuTrigger>
        </div>
        <DropdownMenuContent>
          {firstItem?.type && (
            <DropdownMenuItem inset={false} className='py-0 px-1'>
              {ItemIcon?.icon && <ItemIcon.icon strokeWidth={1.75} size={18} color={ItemIcon.color} />}
              <AddButton
                t={t}
                variant='ghost'
                className='px-0'
                view={firstItem}
                onClick={handleCreate}
              />
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {views.filter((view) => view.type !== docType).map((view) => {
            const ViewIcon = view.icon

            return (
              <DropdownMenuItem inset={false} className='py-0 px-1' key={view.name}>
                {ViewIcon?.icon && <ViewIcon.icon strokeWidth={1.75} size={18} color={ViewIcon.color} />}
                <AddButton
                  t={t}
                  variant='ghost'
                  className='px-0'
                  hast={hasHast}
                  view={view}
                  onClick={handleCreate}
                />
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  )
}
