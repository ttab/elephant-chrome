import { useAuthors } from '@/hooks/useAuthors'
import { getAuthorBySub } from '@/lib/getAuthorBySub'
import { format } from 'date-fns'
import type { Status as DocumentStatuses } from '@ttab/elephant-api/repository'
import { useTranslation } from 'react-i18next'

export const PreVersionInfo = ({ version, versionStatusHistory }: { version: bigint | undefined, versionStatusHistory: DocumentStatuses[] | undefined }) => {
  const authors = useAuthors()
  const currentVersion = versionStatusHistory?.find((v) => v?.version === version)
  const createdBy = getAuthorBySub(authors, currentVersion?.creator)?.name || '???'
  const { t } = useTranslation('shared')

  return currentVersion && (
    <div className='text-sm italic pb-2'>
      <div className='text-muted-foreground'>{t('authors.createdTimeBy', { created: format(currentVersion?.created, 'yyyy-MM-dd HH:mm'), author: createdBy })}</div>
    </div>
  )
}
