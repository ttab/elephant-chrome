import { Button } from '@ttab/elephant-ui'
import { PlusIcon, ChevronDownIcon } from '@ttab/elephant-ui/icons'
import { type ReactNode } from 'react'
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
import { documentTypeValueFormat } from '@/defaults/documentTypeFormats'
import type { buttonVariants } from '@ttab/elephant-ui'
import type { VariantProps } from 'class-variance-authority'
import type { QueryParams } from '@/hooks/useQuery'
import { applicationMenu } from '@/defaults/applicationMenuItems'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'

type Variant = VariantProps<typeof buttonVariants>['variant']
type ButtonView = { name: View, type: string, icon?: { icon?: LucideIcon, color?: string } }

const AddButton = ({
  withNew,
  variant = 'default',
  className,
  showModal,
  hideModal,
  view,
  query,
  t
}: {
  query: QueryParams
  withNew?: boolean
  variant?: Variant
  className?: string
  showModal?: (content: ReactNode, type?: 'dialog') => void
  hideModal?: () => void
  view: ButtonView
  t: TFunction
}) => {
  const ViewDialog = Views[view.name]
  const typeLabel = (t?: string) => t ? documentTypeValueFormat[t].label : ''

  return (
    <Button
      size='sm'
      variant={variant}
      className={!withNew ? '' : cn('h-8 pr-4', className)}
      onClick={() => {
        const id = crypto.randomUUID()
        const initialDocument = getTemplateFromView(view.name)(id, { query })

        if (showModal) {
          showModal(
            <ViewDialog
              onDialogClose={hideModal}
              asDialog
              id={id}
              document={initialDocument}
            />
          )
        }
      }}
    >
      {withNew && <PlusIcon size={18} strokeWidth={1.75} />}
      <span className='pl-0.5'>{`${withNew ? t('common:misc.new') : typeLabel(view.type)}`}</span>
    </Button>
  )
}

export const AddButtonGroup = ({ docType = 'core/planning-item', query }: { type: View, query: QueryParams, docType?: string }) => {
  const { showModal, hideModal } = useModal()
  const { t } = useTranslation()

  const getIcon = (t: View): { icon: LucideIcon | undefined, color?: string } => {
    const group = applicationMenu.groups.find((g) => g.items.find((itm) => itm.name.includes(t)))
    const icon = group?.items.find((item) => item.name.includes(t))
    return { icon: icon?.icon, color: icon?.color }
  }

  const views: Array<{ name: View, type: string, icon?: { icon?: LucideIcon, color?: string } }> = [
    { name: 'Planning', type: 'core/planning-item', icon: getIcon('Planning') },
    { name: 'Event', type: 'core/event', icon: getIcon('Event') },
    { name: 'QuickArticle', type: 'core/article', icon: getIcon('QuickArticle') },
    { name: 'Factbox', type: 'core/factbox', icon: getIcon('Factbox') },
    { name: 'Flash', type: 'core/flash', icon: getIcon('Flash') }
  ]

  const firstItem = views.find((view) => view.type === docType) as ButtonView
  const ItemIcon = firstItem.icon


  return (
    <ButtonGroup>
      <AddButton
        t={t}
        withNew
        showModal={showModal}
        hideModal={hideModal}
        view={firstItem?.type ? firstItem : views[0]}
        query={query}
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
                showModal={showModal}
                hideModal={hideModal}
                view={firstItem}
                query={query}
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
                  showModal={showModal}
                  hideModal={hideModal}
                  view={view}
                  query={query}
                />
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  )
}
