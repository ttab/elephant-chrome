import type { JSX } from 'react'
import type { ViewMetadata } from '@/types'
import { View, ViewHeader } from '@/components/View'
import { SettingsIcon } from '@ttab/elephant-ui/icons'
import { useTranslation } from 'react-i18next'
import { useHasUnit } from '@/hooks'
import { NynorskSection } from './NynorskSection'
import { WireStreamsSection } from './WireStreamsSection'

const meta: ViewMetadata = {
  name: 'UserPreferences',
  path: `${import.meta.env.BASE_URL || ''}/user-preferences`,
  widths: {
    sm: 12,
    md: 12,
    lg: 6,
    xl: 6,
    '2xl': 5,
    hd: 4,
    fhd: 3,
    qhd: 3,
    uhd: 2
  }
}

export const UserPreferences = (): JSX.Element => {
  const { t } = useTranslation('app')
  const isNpkUser = useHasUnit('/redaktionen-npk')

  return (
    <View.Root>
      <ViewHeader.Root>
        <ViewHeader.Title
          name='UserPreferences'
          title={t('settings.title')}
          icon={SettingsIcon}
          iconColor='#006bb3'
        />
        <ViewHeader.Content />
        <ViewHeader.Action />
      </ViewHeader.Root>

      <View.Content>
        <div className='flex flex-col gap-2 p-4 max-w-2xl'>
          <p className='text-sm text-muted-foreground pb-2'>
            {t('settings.description')}
          </p>

          {isNpkUser && <NynorskSection />}

          <WireStreamsSection />
        </div>
      </View.Content>
    </View.Root>
  )
}

UserPreferences.meta = meta
