import { ZapIcon } from '@ttab/elephant-ui/icons'
import { cn } from '@ttab/elephant-ui/utils'
import { useSession } from 'next-auth/react'
import { useRegistry } from '@/hooks/useRegistry'
import { useFeatureFlags } from '@/hooks/useFeatureFlags'
import useSWR from 'swr'
import { useRepositoryEvents } from '@/hooks/useRepositoryEvents'
import type { JSX } from 'react'

type HastState = 'active' | 'inactive' | false

function getHastState(
  hastValue: number,
  usableId: number,
  isUsable: boolean
): HastState {
  if (hastValue === 0) {
    return 'inactive'
  }
  if (hastValue === usableId + 1) {
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
 * but is consumed or disabled, hidden when no hast block.
 */
export const HastIndicator = ({ documentId, size = 14 }: {
  documentId?: string
  size?: number
}): JSX.Element | null => {
  const featureFlags = useFeatureFlags(['hasHast'])
  const { repository } = useRegistry()
  const { data: session } = useSession()

  const { data: hastState, mutate } = useSWR(
    featureFlags.hasHast && documentId
      ? ['hast-indicator', documentId]
      : null,
    async (): Promise<HastState> => {
      if (!documentId || !session?.accessToken || !repository) {
        return false
      }
      const [doc, meta] = await Promise.all([
        repository.getDocument({
          uuid: documentId,
          accessToken: session.accessToken
        }),
        repository.getMeta({
          uuid: documentId,
          accessToken: session.accessToken
        })
      ])
      const hastBlock = doc?.document?.meta.find((b) => b.type === 'ntb/hast')
      if (!hastBlock) {
        return false
      }
      const hastValue = Number(hastBlock.value || '0')
      const usableId = Number(meta?.meta?.heads?.['usable']?.id || '0')
      const isUsable = meta?.meta?.workflowState === 'usable'
      return getHastState(hastValue, usableId, isUsable)
    }
  )

  useRepositoryEvents(['core/article'], (event) => {
    if (event.uuid === documentId) {
      void mutate()
    }
  })

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
