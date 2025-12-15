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
  Dialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  SheetClose
} from '@ttab/elephant-ui'
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
  hideModal,
  docType
}: {
  type: View
  withNew?: boolean
  variant?: Variant
  className?: string
  showModal?: (content: ReactNode, type?: 'dialog') => void
  hideModal?: () => void
  docType?: string
}) => {
  const ViewDialog = Views[type]
  const typeLabel = (t?: string) => t ? documentTypeValueFormat[t].label : ''

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
      <span className='pl-0.5'>{`${withNew ? 'Ny' : typeLabel(docType)}`}</span>
    </Button>
  )
}

export const AddButtonGroup = ({ type, docType }: { type: View, docType?: string }) => {
  const { showModal, hideModal } = useModal()
  const ArticleViewDialog = Views['QuickArticle' as View]
  return (
    <ButtonGroup>
      <AddButton
        withNew
        type={type}
        showModal={showModal}
        hideModal={hideModal}
        docType={docType}
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
          <DropdownMenuItem inset={false} className='p-0'>
            <AddButton
              type={type}
              variant='ghost'
              className='px-0'
              showModal={showModal}
              hideModal={hideModal}
              docType={docType}
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
              <DropdownMenuItem inset={false} className='p-0 cursor-pointer'>
                <div>Artikel</div>
              </DropdownMenuItem>
            </SheetClose>
          </Dialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  )
}
