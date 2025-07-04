import { ViewHeader } from '@/components/View'
import { Button, Popover, PopoverContent, PopoverTrigger } from '@ttab/elephant-ui'
import { BookA, Plus } from '@ttab/elephant-ui/icons'
import { DateChanger } from '@/components/Header/Datechanger'
import { useModal } from '@/components/Modal/useModal'
import { PrintFlows } from './PrintFlows'
import { useLink } from '@/hooks/useLink'

/**
 * PrintArticlesHeader component.
 *
 * This component renders the header for the Print Articles view. It includes
 * a title, buttons for creating new articles and flows, and a date changer.
 *
 * @param props - The component props.
 * @param props.setOpenCreateFlow - Function to set the state for opening the create flow dialog.
 * @param props.setOpenCreateArticle - Function to set the state for opening the create article dialog.
 * @returns The rendered component.
 */

export const PrintArticlesHeader = (): JSX.Element => {
  const { showModal, hideModal } = useModal()
  const openDictionary = useLink('PrintDictionary')

  return (
    <ViewHeader.Root className='flex flex-row gap-2 items-center justify-between'>
      <div className='flex flex-row gap-4 items-center justify-start'>
        <ViewHeader.Title title='Print' name='Print' />
        <Popover>
          <PopoverTrigger asChild>
            <Button title='Skapa ny...' size='sm' className='gap-1 px-2 py-0'>
              <Plus strokeWidth={1.75} size={16} />
              Nytt
            </Button>
          </PopoverTrigger>
          <PopoverContent className='flex flex-col gap-2'>
            <Button
              title='Skapa en text i ett flöde'
              variant='outline'
              onClick={() => {
                showModal(
                  <PrintFlows asDialog onDialogClose={hideModal} action='createArticle' />
                )
              }}
            >
              Ny artikel
            </Button>
            <Button
              title='Öppna dialogruta för att välja ett flöde. Artiklarna för flödet kommer sedan att skapas av backend enligt definitionen i flödet.'
              variant='outline'
              onClick={() => {
                showModal(
                  <PrintFlows asDialog onDialogClose={hideModal} action='createFlow' />
                )
              }}
            >
              Nytt flöde
            </Button>
          </PopoverContent>
        </Popover>
        <DateChanger type='Print' />
      </div>
      <div className='flex flex-row gap-2 items-center justify-end'>
        <Button
          title='Skapa en text i ett flöde'
          variant='outline'
          size='sm'
          onClick={() => {
            openDictionary(undefined, {})
          }}
        >
          <BookA strokeWidth={1.75} size={18} />
        </Button>
        <ViewHeader.Action>
        </ViewHeader.Action>
      </div>
    </ViewHeader.Root>
  )
}
