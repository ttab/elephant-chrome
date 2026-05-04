import { useCallback, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRegistry } from './useRegistry'
import {
  attachArticleAssignment,
  buildFallbackPlanning,
  deriveNewPlanning,
  planningReferencesArticle,
  prepareArticleConversion
} from '@/shared/convertArticleType'
import type { Document } from '@ttab/elephant-api/newsdoc'
import { replaceDeliverable } from '@/lib/index/replaceDeliverable'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { CalendarDaysIcon, PenBoxIcon } from '@ttab/elephant-ui/icons'
import { ToastAction } from '@/components/ToastAction'
import type { Block } from '@ttab/elephant-api/newsdoc'
import type { ValidationResult } from '@ttab/elephant-api/repository'

function warnOnPruneErrors(errors: ValidationResult[]): void {
  if (!errors.length) {
    return
  }
  console.warn('Fields dropped during conversion prune:', errors)
  toast.warning(errors.map((e) => e.error).filter(Boolean).join('\n') || 'Some fields were dropped during conversion.')
}

export type ConvertArgs
  = | { targetType: 'core/article#timeless', category: Block }
    | {
      targetType: 'core/article'
      targetDate: string
      sourcePlanningId?: string
    }

export type ConversionResult
  = | { success: false }
    | { success: true, kind: 'timeless', newDocumentId: string }
    | {
      success: true
      kind: 'article'
      newDocumentId: string
      newPlanningId: string
    }

interface UseConvertArticleTypeResult {
  convert: (documentId: string, args: ConvertArgs) => Promise<ConversionResult>
  isConverting: boolean
}

/**
 * Convert an article between its regular and timeless variants. Both
 * directions run client-side via `repository.createDerivedDocument`
 * (atomic bulkUpdate). Timeless→article additionally carries a companion
 * planning in the same bulkUpdate so the derived article is owned as a
 * deliverable from the first moment it exists.
 */
export function useConvertArticleType(): UseConvertArticleTypeResult {
  const { repository } = useRegistry()
  const { data: session } = useSession()
  const { t } = useTranslation()
  const [isConverting, setIsConverting] = useState(false)
  const accessToken = session?.accessToken

  const convert = useCallback(async (
    documentId: string,
    args: ConvertArgs
  ): Promise<ConversionResult> => {
    if (!repository || !accessToken) {
      toast.error(t('views:timeless.toasts.notAuthenticated'))
      return { success: false }
    }

    setIsConverting(true)

    try {
      if (args.targetType === 'core/article') {
        const sourceResponse = await repository.getDocument({
          uuid: documentId,
          accessToken
        })
        if (!sourceResponse?.document) {
          toast.error(t('views:timeless.toasts.documentNotFound'))
          return { success: false }
        }
        if (sourceResponse.document.type !== 'core/article#timeless') {
          toast.error(t('views:timeless.toasts.conversionFailed', {
            message: 'source is not a timeless article'
          }))
          return { success: false }
        }

        const newPlanningUuid = crypto.randomUUID()
        let basePlanning: Document
        if (args.sourcePlanningId) {
          const planningResponse = await repository.getDocument({
            uuid: args.sourcePlanningId,
            accessToken
          })
          if (!planningResponse?.document) {
            toast.error(t('views:timeless.toasts.conversionFailed', {
              message: 'source planning not found'
            }))
            return { success: false }
          }
          if (!planningReferencesArticle(planningResponse.document, documentId)) {
            toast.error(t('views:timeless.toasts.conversionFailed', {
              message: 'source planning does not reference the timeless article'
            }))
            return { success: false }
          }
          basePlanning = deriveNewPlanning({
            sourcePlanning: planningResponse.document,
            targetDate: args.targetDate,
            newUuid: newPlanningUuid
          })
        } else {
          basePlanning = buildFallbackPlanning({
            sourceTimeless: sourceResponse.document,
            targetDate: args.targetDate,
            newUuid: newPlanningUuid
          })
        }

        const { newDocument: newArticle, errors: pruneErrors } = await prepareArticleConversion({
          sourceDocument: sourceResponse.document,
          targetType: 'core/article',
          repository,
          accessToken
        })
        warnOnPruneErrors(pruneErrors)

        const newPlanning = attachArticleAssignment({
          planning: basePlanning,
          articleId: newArticle.uuid,
          articleTitle: sourceResponse.document.title ?? '',
          targetDate: args.targetDate
        })

        await repository.createDerivedDocument({
          newDocument: newArticle,
          newPlanning,
          sourceStatusUpdate: {
            uuid: sourceResponse.document.uuid,
            name: 'used',
            version: sourceResponse.version
          },
          accessToken
        })

        toast.success(t('views:timeless.toasts.articlePlanned'), {
          action: (
            <div className='flex gap-1 justify-end ml-auto [&>div]:w-auto'>
              <ToastAction
                documentId={newArticle.uuid}
                withView='Editor'
                label={t('views:timeless.toasts.openArticle')}
                Icon={PenBoxIcon}
                target='last'
              />
              <ToastAction
                documentId={newPlanning.uuid}
                withView='Planning'
                label={t('views:timeless.toasts.openPlanning')}
                Icon={CalendarDaysIcon}
                target='last'
              />
            </div>
          )
        })

        return {
          success: true,
          kind: 'article',
          newDocumentId: newArticle.uuid,
          newPlanningId: newPlanning.uuid
        }
      }

      const response = await repository.getDocument({
        uuid: documentId,
        accessToken
      })

      if (!response?.document) {
        toast.error(t('views:timeless.toasts.documentNotFound'))
        return { success: false }
      }

      const { newDocument, errors: pruneErrors } = await prepareArticleConversion({
        sourceDocument: response.document,
        targetType: 'core/article#timeless',
        repository,
        accessToken,
        // Timeless schema requires exactly one core/timeless-category subject link.
        extraLinks: [args.category]
      })
      warnOnPruneErrors(pruneErrors)

      // article → timeless: don't touch source status — core/article
      // workflow doesn't carry a "used" state.
      await repository.createDerivedDocument({
        newDocument,
        accessToken
      })

      // Re-point any planning that owned the source article onto the new
      // timeless, and flip the matching assignment's type. Routed via the
      // server so Hocuspocus sees the change.
      await replaceDeliverable({
        fromArticleId: documentId,
        toArticleId: newDocument.uuid,
        newAssignmentType: 'timeless'
      })

      toast.success(t('views:timeless.toasts.timelessSaved'), {
        action: (
          <ToastAction
            documentId={newDocument.uuid}
            withView='Editor'
            label={t('views:timeless.toasts.openTimeless')}
            Icon={PenBoxIcon}
            target='last'
          />
        )
      })
      return {
        success: true,
        kind: 'timeless',
        newDocumentId: newDocument.uuid
      }
    } catch (err) {
      console.error('Article type conversion failed:', err)
      const message = err instanceof Error ? err.message : 'Unknown error'
      toast.error(t('views:timeless.toasts.conversionFailed', { message }))
      return { success: false }
    } finally {
      setIsConverting(false)
    }
  }, [repository, accessToken, t])

  return { convert, isConverting }
}
