import { DocumentStatuses } from '@/defaults/documentStatuses'
import { Tooltip } from '@ttab/elephant-ui'

export const DocumentStatus = ({ status }: { status: string }): JSX.Element => {
  const documentStatus = DocumentStatuses.find((type) => type.value === status || type.value === 'draft')
  return (
    <Tooltip content={documentStatus?.label || ''}>
      <div className='flex items-center'>
        {documentStatus?.icon
          ? <documentStatus.icon {...documentStatus.iconProps} />
          : null}
      </div>
    </Tooltip>
  )
}
