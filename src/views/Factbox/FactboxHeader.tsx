import { type JSX } from 'react'
import { StatusMenu } from '@/components/DocumentStatus/StatusMenu'
import { ViewHeader } from '@/components/View'
import { MetaSheet } from '@/components/MetaSheet/MetaSheet'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
import { useTranslation } from 'react-i18next'
import { documentTypeValueFormat } from '@/defaults/documentTypeFormats'

export const FactboxHeader = ({ ydoc, onDialogClose, asDialog }: {
  ydoc: YDocument<Y.Map<unknown>>
  asDialog: boolean
  onDialogClose?: () => void
}): JSX.Element => {
  const { t } = useTranslation('factbox')
  const Icon = documentTypeValueFormat?.['core/factbox']?.icon

  return (
    <ViewHeader.Root asDialog={asDialog}>
      <ViewHeader.Title
        name='Factbox'
        title={t('title')}
        icon={Icon}
        asDialog={asDialog}
      />
      <ViewHeader.Content className='justify-start'>
        <div className='max-w-[850px] mx-auto flex flex-row gap-1 justify-between items-center w-full'>
          <div className='flex flex-row gap-2 justify-start items-center @6xl/view:-ml-20'>
          </div>

          <div className='flex flex-row gap-2 justify-end items-center'>
            {!asDialog && (
              <>
                <StatusMenu
                  ydoc={ydoc}
                />
              </>
            )}
            {!!ydoc && !asDialog && (
              <ViewHeader.RemoteUsers ydoc={ydoc} />
            )}
          </div>
          <ViewHeader.Action ydoc={ydoc} onDialogClose={onDialogClose} asDialog={asDialog}>
            { !asDialog && ydoc && (
              <MetaSheet ydoc={ydoc} />
            )}
          </ViewHeader.Action>

        </div>
      </ViewHeader.Content>
    </ViewHeader.Root>
  )
}
