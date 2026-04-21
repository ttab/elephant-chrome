import { type JSX } from 'react'
import { StatusMenu } from '@/components/DocumentStatus/StatusMenu'
import { ViewHeader } from '@/components/View'
import { MetaSheet } from '@/components/MetaSheet/MetaSheet'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
import { useTranslation } from 'react-i18next'
import { documentTypeValueFormat } from '@/defaults/documentTypeFormats'
import { PenOffIcon } from '@ttab/elephant-ui/icons'

export const FactboxHeader = ({ ydoc, onDialogClose, asDialog }: {
  ydoc?: YDocument<Y.Map<unknown>>
  asDialog: boolean
  onDialogClose?: () => void
}): JSX.Element => {
  const { t } = useTranslation('factbox')
  const Icon = ydoc ? documentTypeValueFormat?.['core/factbox']?.icon : PenOffIcon

  return (
    <ViewHeader.Root asDialog={asDialog}>
      <ViewHeader.Title
        name='Factbox'
        title={t('title')}
        icon={Icon}
        asDialog={asDialog}
      />
      <ViewHeader.Content className='justify-start'>
        <div className='mx-auto flex flex-row gap-1 justify-between items-center w-full'>
          <div className='flex flex-row gap-2 justify-end items-center @6xl/view:-ml-20'>
          </div>

          <div className='flex flex-row gap-4 justify-start items-center'>
            <>
              {!asDialog && ydoc
                && (
                  <StatusMenu
                    ydoc={ydoc}
                  />
                )}
            </>
            {!!ydoc && !asDialog && (
              <ViewHeader.RemoteUsers ydoc={ydoc} />
            )}
            <ViewHeader.Action ydoc={ydoc} onDialogClose={onDialogClose} asDialog={asDialog}>
              
              { !asDialog && ydoc && (
                <MetaSheet ydoc={ydoc} />
              )}

            </ViewHeader.Action>
          </div>

        </div>
      </ViewHeader.Content>
    </ViewHeader.Root>
  )
}
