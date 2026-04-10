import { useAuthors } from '@/hooks/useAuthors'
import { getAuthorBySub } from '@/lib/getAuthorBySub'
import { format } from 'date-fns'
import type { Status as DocumentStatuses } from '@ttab/elephant-api/repository'

export const PreVersionInfo = ({ version, versionStatusHistory }: { version: bigint | undefined, versionStatusHistory: DocumentStatuses[] | undefined }) => {
  const authors = useAuthors()
  const currentVersion = versionStatusHistory?.find((v) => v?.version === version)
  const createdBy = getAuthorBySub(authors, currentVersion?.creator)?.name || '???'

  return currentVersion && (
    <div className='text-sm italic pb-2'>
      <div className='text-muted-foreground'>{`Skapad: ${format(currentVersion?.created, 'yyyy-MM-dd HH:mm')}${` av ${createdBy}`}`}</div>
    </div>
  )
}
