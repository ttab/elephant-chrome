import { useAuthors } from '@/hooks/useAuthors'
import { getCreatorBySub } from './getCreatorBySub'
import { format } from 'date-fns'
import type { DocumentVersion } from '@ttab/elephant-api/repository'

export const PreversionViewInfo = ({ previewVersion, versionHistory }: { previewVersion: bigint | undefined, versionHistory: DocumentVersion[] | undefined }) => {
  const authors = useAuthors()
  const currentVersion = versionHistory?.find((v) => v?.version === previewVersion)
  const createdBy = getCreatorBySub({ authors, creator: currentVersion?.creator })?.name || '???'

  return currentVersion && (
    <div className='text-sm italic pb-2'>
      <div className='text-muted-foreground'>{`Skapad: ${format(currentVersion?.created, 'yyyy-MM-dd HH:mm')}${` av ${createdBy}`}`}</div>
    </div>
  )
}
