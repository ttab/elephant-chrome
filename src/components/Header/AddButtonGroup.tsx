import { Button } from '@ttab/elephant-ui'
import { PlusIcon, ChevronDownIcon } from '@ttab/elephant-ui/icons'
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
import { useLink } from '@/hooks/useLink'
import { useRegistry } from '@/hooks/index'
import { useSession } from 'next-auth/react'
import { createNewFactbox } from './lib/createNewFactbox'
import { toast } from 'sonner'

const addButtonTypes = ['core/planning-item', 'core/event', 'core/article', 'core/factbox', 'core/flash'] as const

type Variant = VariantProps<typeof buttonVariants>['variant']
type ButtonView = { name: View, type: string, icon?: { icon?: LucideIcon, color?: string } }

const AddButton = ({
  withNew,
  variant = 'default',
  className,
  view,
  onClick
}: {
  withNew?: boolean
  variant?: Variant
  className?: string
  view: ButtonView
  onClick: (view: ButtonView) => void
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
      <span className='pl-0.5'>{`${withNew ? 'Ny' : typeLabel(view.type)}`}</span>
    </Button>
  )
}

export const AddButtonGroup = ({ docType = 'core/planning-item', query }: { type: View, query: QueryParams, docType?: string }) => {
  const { showModal, hideModal } = useModal()
  const { repository } = useRegistry()
  const openFactboxEditor = useLink('Factbox')
  const { data: session } = useSession()

  const views: ButtonView[] = addButtonTypes.map((type) => {
    const format = addButtonGroupValueFormat[type]
    return { name: format.key as View, type, icon: { icon: format.icon, color: format.color } }
  })

  const firstItem = views.find((view) => view.type === docType) as ButtonView
  const ItemIcon = firstItem.icon

  const handleCreate = (view: ButtonView) => {
    const ViewDialog = Views[view.name]
    const id = crypto.randomUUID()

    if (view.name === 'Factbox') {
      createNewFactbox(repository, session, id)
        .then((id) => openFactboxEditor(undefined, { id }, undefined))
        .catch((error: unknown) => {
          console.error('Error creating factbox:', error)
          toast.error((error as Error).message)
        })
    } else if (showModal) {
      const initialDocument = getTemplateFromView(view.name)(id, { query })
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
                  variant='ghost'
                  className='px-0'
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
