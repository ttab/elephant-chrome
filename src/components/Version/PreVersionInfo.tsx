import { useAuthors } from '@/hooks/useAuthors'
import { getCreatorBySub } from './getCreatorBySub'
import { format } from 'date-fns'
import type { Status as DocumentStatuses } from '@ttab/elephant-api/repository'

export const PreVersionInfo = ({ version, versionStatusHistory }: { version: bigint | undefined, versionStatusHistory: DocumentStatuses[] | undefined }) => {
  const authors = useAuthors()
  const currentVersion = versionStatusHistory?.find((v) => v?.version === version)
  const createdBy = getCreatorBySub({ authors, creator: currentVersion?.creator })?.name || '???'

  return currentVersion && (
    <div className='text-sm italic pb-2'>
      <div className='text-muted-foreground'>{`Skapad: ${format(currentVersion?.created, 'yyyy-MM-dd HH:mm')}${` av ${createdBy}`}`}</div>
    </div>
  )
}
