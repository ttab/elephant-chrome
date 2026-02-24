import { type ViewMetadata, type ViewProps } from '@/types'
import { View, ViewHeader } from '@/components/View'
import { MessageCircleWarningIcon } from '@ttab/elephant-ui/icons'
import { type JSX } from 'react'
import { useTranslation } from 'react-i18next'

const meta: ViewMetadata = {
  name: 'Error',
  path: `${import.meta.env.BASE_URL || ''}/error`,
  widths: {
    sm: 12,
    md: 12,
    lg: 6,
    xl: 6,
    '2xl': 6,
    hd: 6,
    fhd: 4,
    qhd: 3,
    uhd: 2
  }
}


export const Error = ({ title, error, message }: ViewProps & {
  title?: string
  error?: Error
  message?: string
}): JSX.Element => {
  const { t } = useTranslation('common')

  return (
    <View.Root>
      <ViewHeader.Root>
        <ViewHeader.Title name='Error' title={t('errors:messages.errorTitle')} icon={MessageCircleWarningIcon} />
        <ViewHeader.Content />
        <ViewHeader.Action />
      </ViewHeader.Root>

      <View.Content className='max-w-[800px] p-6'>
        <h1 className='text-3xl font-bold mb-6'>{title || error?.message || t('errors:messages.unknown')}</h1>
        {message && (
          <p className='text-md'>
            {message}
          </p>
        )}

        {error && (
          <div className='text-sm bg-gray-100 p-4 rounded-lg mt-4 dark:bg-slate-600'>
            <pre className='whitespace-pre-wrap'>
              {JSON.stringify(error.stack, null, 2)}
            </pre>
          </div>
        )}

        {!message && !error && (
          <p className='text-md'>
            {t('errors:messages.unknownErrorAdminInfo')}
          </p>
        )}
      </View.Content>
    </View.Root>
  )
}

Error.meta = meta
