import { useLink } from '@/hooks/useLink'
import { Button } from '@ttab/elephant-ui'
import { BookAIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'


export const DictionaryButton = ({ variant }: { variant: 'ghost' | 'outline' }) => {
  const openDictionary = useLink('PrintDictionary')
  const { t } = useTranslation('print')
  return (
    <Button
      title={t('articles.header.openDictionary')}
      variant={variant}
      size='sm'
      onClick={() => {
        openDictionary(undefined, {})
      }}
      className='hover:bg-gray-200 dark:hover:bg-table-focused rounded-md px-1 flex flex-row items-center justify-center gap-1 h-9 p-0 m-0 min-w-9'
    >
      <BookAIcon strokeWidth={1.75} size={18} />
    </Button>
  )
}
