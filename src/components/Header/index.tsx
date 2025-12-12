import { DateChanger } from '@/components/Header/Datechanger'
import { TabsGrid } from '@/components/Header/LayoutSwitch'
import {
  Button,
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
import { PlusIcon, ChevronDownIcon } from '@ttab/elephant-ui/icons'
import { type View } from '@/types/index'
import { PersonalAssignmentsFilter } from './PersonalAssignmentsFilter'
import { type ReactNode, useMemo, type JSX } from 'react'
import { useModal } from '../Modal/useModal'
import * as Views from '@/views'
import { getTemplateFromView } from '@/shared/templates/lib/getTemplateFromView'
import { cn } from '@ttab/elephant-ui/utils'

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
  variant?: 'link' | 'secondary' | 'default' | 'destructive' | 'outline' | 'ghost' | 'icon' | null
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

export const Header = ({ assigneeId, type }: {
  type: View
  assigneeId?: string | undefined
}): JSX.Element => {
  const { showModal, hideModal } = useModal()
  const ArticleViewDialog = Views['QuickArticle' as View]

  const showButton = useMemo(() => {
    const viewTypes: View[] = ['Planning', 'Event', 'Factbox']
    if (viewTypes.includes(type)) {
      return true
    }
    return false
  }, [type])

  return (
    <>
      {showButton && (
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
      )}

      <div className='hidden sm:block'>
        <TabsGrid />
      </div>

      <DateChanger type={type} />

      {type === 'Assignments'
        && <PersonalAssignmentsFilter assigneeId={assigneeId} />}
    </>
  )
}
