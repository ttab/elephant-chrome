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
import { addButtonGroupValueFormat } from '@/defaults/documentTypeFormats'
import type { buttonVariants } from '@ttab/elephant-ui'
import type { VariantProps } from 'class-variance-authority'
import type { QueryParams } from '@/hooks/useQuery'
import type { LucideIcon } from 'lucide-react'

const addButtonTypes = ['core/planning-item', 'core/event', 'core/article', 'core/factbox', 'core/flash'] as const

type Variant = VariantProps<typeof buttonVariants>['variant']
type ButtonView = { name: View, type: string, icon?: { icon?: LucideIcon, color?: string } }

const AddButton = ({
  withNew,
  variant = 'default',
  className,
  showModal,
  hideModal,
  view,
  query
}: {
  query: QueryParams
  withNew?: boolean
  variant?: Variant
  className?: string
  showModal?: (content: ReactNode, type?: 'dialog') => void
  hideModal?: () => void
  view: ButtonView
}) => {
  const ViewDialog = Views[view.name]
  const typeLabel = (t?: string) => t ? addButtonGroupValueFormat[t].label : ''

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
      <span className='pl-0.5'>{`${withNew ? 'Ny' : typeLabel(view.type)}`}</span>
    </Button>
  )
}

export const AddButtonGroup = ({ docType = 'core/planning-item', query }: { type: View, query: QueryParams, docType?: string }) => {
  const { showModal, hideModal } = useModal()

  const views: ButtonView[] = addButtonTypes.map((type) => {
    const format = addButtonGroupValueFormat[type]
    return { name: format.key as View, type, icon: { icon: format.icon, color: format.color } }
  })

  const firstItem = views.find((view) => view.type === docType) as ButtonView
  const ItemIcon = firstItem.icon


  return (
    <ButtonGroup>
      <AddButton
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
