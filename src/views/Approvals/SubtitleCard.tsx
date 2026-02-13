import type { PreprocessedApprovalData } from './preprocessor'
import { useWorkflowStatus } from '@/hooks/useWorkflowStatus'
import { CAUSE_KEYS } from '@/defaults/causekeys'

export const SubtitleCard = ({ item }: { item: PreprocessedApprovalData }) => {
  const [documentStatus] = useWorkflowStatus({ documentId: item._deliverable?.id })

  const slugline = item._assignment.meta.find((m) => m.type === 'tt/slugline')?.value
  const versionLabel = getVersionLabel(item)
  const cause = documentStatus?.cause
    ? CAUSE_KEYS[documentStatus.cause as keyof typeof CAUSE_KEYS].short
    : ''

  if (!slugline && !versionLabel && !cause) return null

  return (
    <div className='text-xs font-normal opacity-60 flex gap-1'>
      {slugline && <div>{slugline}</div>}
      {versionLabel && <div>{versionLabel}</div>}
      {cause && <div>{`- ${cause}`}</div>}
    </div>
  )
}

function getVersionLabel(item: PreprocessedApprovalData): string | undefined {
  const meta = item._deliverable?.meta
  if (!meta) return undefined

  const order = Number(meta.heads.usable?.id)
  if (!order || order < 1) return undefined

  if (meta.workflowState === 'usable' && order === 1) return undefined

  const version = meta.workflowState !== 'usable' ? order + 1 : order
  return `- v${version}`
}
