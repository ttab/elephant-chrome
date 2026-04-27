import { ZapIcon } from '@ttab/elephant-ui/icons'
import { cn } from '@ttab/elephant-ui/utils'
import { useSession } from 'next-auth/react'
import { useRegistry } from '@/hooks/useRegistry'
import { useFeatureFlags } from '@/hooks/useFeatureFlags'
import { useWorkflowStatus } from '@/hooks/useWorkflowStatus'
import useSWR from 'swr'
import { useRepositoryEvents } from '@/hooks/useRepositoryEvents'
import { useCallback, type JSX } from 'react'

type HastState = 'active' | 'inactive' | false

/**
 * Determines hast display state based on version targeting.
 * - 'active': hast targets next version (hastValue === usableId + 1) or
 *   document is currently usable and hast targets current version
 * - 'inactive': hast disabled (value=0) or targeting a consumed/past version
 */
function getHastState(
  hastValue: bigint,
  usableId: bigint,
  isUsable: boolean
): HastState {
  if (hastValue === 0n) {
    return 'inactive'
  }
  if (hastValue === usableId + 1n) {
    return 'active'
  }
  if (isUsable && hastValue === usableId) {
    return 'active'
  }
  return 'inactive'
}

/**
 * Fetches hast state for a document and renders a zap icon.
 * Red when hast targets the next version, muted when hast exists
 * but is consumed or disabled (value=0), orange on fetch error,
 * hidden when no hast block or session unavailable.
 */
export const HastIndicator = ({ documentId, size = 14 }: {
  documentId?: string
  size?: number
}): JSX.Element | null => {
  const featureFlags = useFeatureFlags(['hasHast'])
  const { repository } = useRegistry()
  const { data: session } = useSession()

  // Get workflow status (includes usableId and current status name)
  const [workflowStatus] = useWorkflowStatus({ documentId })
  const usableId = workflowStatus?.usableId ?? 0n
  const isUsable = workflowStatus?.name === 'usable'

  // Fetch hast block value from document
  const { data: hastValue, error, mutate } = useSWR<bigint | false, Error>(
    featureFlags.hasHast && documentId && session?.accessToken
      ? ['hast-indicator', documentId, session.accessToken]
      : null,
    async (): Promise<bigint | false> => {
      if (!documentId || !session?.accessToken || !repository) {
        return false
      }
      const doc = await repository.getDocument({
        uuid: documentId,
        accessToken: session.accessToken
      })
      const hastBlock = doc?.document?.meta.find((b) => b.type === 'ntb/hast')
      if (!hastBlock) {
        return false
      }
      try {
        return BigInt(hastBlock.value || '0')
      } catch {
        console.warn('HastIndicator: Invalid hast value', {
          documentId,
          value: hastBlock.value
        })
        return 0n
      }
    }
  )

  // Listen for document changes to refetch hast value
  const handleRepositoryEvent = useCallback(
    (event: { uuid?: string, event?: string, mainDocument?: string }) => {
      const matches = event.uuid === documentId || event.mainDocument === documentId
      if (matches && event.event === 'document') {
        void mutate()
      }
    }, [documentId, mutate])

  useRepositoryEvents(['core/article', 'core/article+meta'], handleRepositoryEvent)

  if (error) {
    console.error('HastIndicator: Failed to fetch hast state', { documentId, error })
    return (
      <ZapIcon
        strokeWidth={1.75}
        size={size}
        className='text-orange-400 opacity-50'
        aria-label='Failed to load hast status'
      />
    )
  }

  if (hastValue === false || hastValue === undefined) {
    return null
  }

  const hastState = getHastState(hastValue, usableId, isUsable)

  if (!hastState) {
    return null
  }

  return (
    <ZapIcon
      strokeWidth={1.75}
      size={size}
      className={cn(
        hastState === 'active' ? 'text-red-500' : 'text-muted-foreground'
      )}
    />
  )
}
