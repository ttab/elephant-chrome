import { ViewHeader } from '@/components/View'
import { Button, Popover, PopoverContent, PopoverTrigger } from '@ttab/elephant-ui'
import { PlusIcon } from '@ttab/elephant-ui/icons'
import { DateChanger } from '@/components/Header/Datechanger'
import { useModal } from '@/components/Modal/useModal'
import { PrintFlows } from './PrintFlows'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { DictionaryButton } from '../PrintEditor/components/DictionaryButton'

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
  const { t } = useTranslation('print')

  return (
    <ViewHeader.Root className='flex flex-row gap-2 items-center justify-between'>
      <div className='flex flex-row gap-4 items-center justify-start'>
        <ViewHeader.Title title={t('articles.title')} name='Print' />
        <Popover>
          <PopoverTrigger asChild>
            <Button title={t('articles.header.createNew')} size='sm' className='gap-1 px-2 py-0'>
              <PlusIcon strokeWidth={1.75} size={16} />
              {t('articles.header.new')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className='flex flex-col gap-2'>
            <Button
              title={t('articles.header.newArticleTooltip')}
              variant='outline'
              onClick={() => {
                showModal(
                  <PrintFlows asDialog onDialogClose={hideModal} action='createArticle' />
                )
              }}
            >
              {t('articles.header.newArticle')}
            </Button>
            <Button
              title={t('articles.header.newFlowTooltip')}
              variant='outline'
              onClick={() => {
                showModal(
                  <PrintFlows asDialog onDialogClose={hideModal} action='createFlow' />
                )
              }}
            >
              {t('articles.header.newFlow')}
            </Button>
          </PopoverContent>
        </Popover>
        <DateChanger type='Print' />
      </div>
      <div className='flex flex-row gap-2 items-center justify-end'>
        <DictionaryButton variant='ghost' />
        <ViewHeader.Action>
        </ViewHeader.Action>
      </div>
    </ViewHeader.Root>
  )
}
