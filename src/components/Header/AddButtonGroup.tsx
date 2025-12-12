import { Button } from '@ttab/elephant-ui'
import { PlusIcon } from '@ttab/elephant-ui/icons'
import { type ReactNode } from 'react'
import * as Views from '@/views'
import { getTemplateFromView } from '@/shared/templates/lib/getTemplateFromView'
import { cn } from '@ttab/elephant-ui/utils'
import type { View } from '@/types/index'
import { useModal } from '../Modal/useModal'
import {
  ButtonGroup,
  ButtonGroupSeparator,
  Dialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  SheetClose
} from '@ttab/elephant-ui'
import { ChevronDownIcon } from '@ttab/elephant-ui/icons'
import { documentTypeValueFormat } from '@/defaults/documentTypeFormats'
import type { buttonVariants } from '@ttab/elephant-ui'
import type { VariantProps } from 'class-variance-authority'

type Variant = VariantProps<typeof buttonVariants>['variant']

const AddButton = ({
  type,
  withNew,
  variant = 'default',
  className,
  showModal,
  hideModal
}: {
  type: View
  withNew?: boolean
  variant?: Variant
  className?: string
  showModal?: (content: ReactNode, type?: 'dialog') => void
  hideModal?: () => void
}) => {
  const ViewDialog = Views[type]
  const typeOutput = (t: string) => t === 'Planning' ? 'Planering' : t === 'Event' ? 'Händelse' : 'Faktaruta'

  return (
    <Button
      size='sm'
      variant={variant}
      className={!withNew ? '' : cn('h-8 pr-4', className)}
      onClick={() => {
        const id = crypto.randomUUID()
        const initialDocument = getTemplateFromView(type)(id)
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
      <span className='pl-0.5'>{`${withNew ? 'Ny' : typeOutput(type)}`}</span>
    </Button>
  )
}

export const AddButtonGroup = ({ type }: { type: View }) => {
  const { showModal, hideModal } = useModal()
  const ArticleViewDialog = Views['QuickArticle' as View]
  return (
    <ButtonGroup>
      <AddButton withNew type={type} showModal={showModal} hideModal={hideModal} />
      <ButtonGroupSeparator />
      <DropdownMenu>
        <div>
          <DropdownMenuTrigger
            asChild
            className='h-full rounded-br-md rounded-tr-md bg-primary/60 hover:bg-primary/30 cursor-pointer hover:text-black dark:hover:bg-gray-700 transition-all'
          >
            <ChevronDownIcon size={18} className='self-center h-full text-white' />
          </DropdownMenuTrigger>
        </div>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem>
            <AddButton
              type={type}
              variant='ghost'
              className='px-0'
              showModal={showModal}
              hideModal={hideModal}
            />
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <Dialog>
            <SheetClose
              key='article'
              className='w-full flex gap-3 items-center px-3 py-2 rounded-md hover:bg-table-focused hover:cursor-pointer'
              onClick={() => {
                showModal(
                  <ArticleViewDialog onDialogClose={hideModal} asDialog />
                )
              }}
            >
              <DropdownMenuItem>
                <div>Artikel</div>
              </DropdownMenuItem>
            </SheetClose>
          </Dialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  )
}
