import { useCallback, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRegistry } from './useRegistry'
import { prepareArticleConversion } from '@/shared/convertArticleType'
import { addAssignmentWithDeliverable } from '@/lib/index/addAssignment'
import type { Block } from '@ttab/elephant-api/newsdoc'
import { replaceDeliverable } from '@/lib/index/replaceDeliverable'
import { snapshotDocument } from '@/lib/snapshotDocument'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { CalendarDaysIcon, PenBoxIcon } from '@ttab/elephant-ui/icons'
import { ToastAction } from '@/components/ToastAction'
import type { ValidationResult } from '@ttab/elephant-api/repository'
import type * as Y from 'yjs'

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
      targetPlanningId?: string
      sourceDocument?: Y.Doc
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
 * Convert an article between its regular and timeless variants.
 *
 * article→timeless runs as a single client-side `repository.createDerivedDocument`
 * (atomic bulkUpdate), then re-points any owning planning at the new timeless.
 *
 * timeless→article is two steps: create the article and mark the source timeless
 * `used` via `createDerivedDocument` (article only), then attach the assignment to
 * the chosen planning (or a server-created one) via `addAssignmentWithDeliverable`.
 * The planning step is intentionally not part of the bulkUpdate (same non-atomic
 * window as the Flash/Wire creation flows).
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
        await snapshotDocument(documentId, undefined, args.sourceDocument)

        const sourceResponse = await repository.getDocument({ uuid: documentId, accessToken })

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

        const timeless = sourceResponse.document
        const slugline = timeless.meta.find((b) => b.type === 'tt/slugline')?.value
        const newsvalue = timeless.meta.find((b) => b.type === 'core/newsvalue')?.value
        const sectionLink = timeless.links.find(
          (l) => l.type === 'core/section' && l.rel === 'section'
        )
        const section = sectionLink
          ? { uuid: sectionLink.uuid, title: sectionLink.title }
          : undefined

        // The addassignment route can only build a fresh planning when it has a
        // section and a newsvalue. Assigning into an existing planning needs
        // neither, so only guard the create-new path.
        if (!args.targetPlanningId && (!section || !newsvalue)) {
          toast.error(t('views:timeless.toasts.conversionFailed', {
            message: 'timeless has no section/newsvalue; pick an existing planning'
          }))
          return { success: false }
        }

        const { newDocument: newArticle, errors: pruneErrors } = await prepareArticleConversion({
          sourceDocument: timeless,
          targetType: 'core/article',
          repository,
          accessToken
        })
        warnOnPruneErrors(pruneErrors)

        await repository.createDerivedDocument({
          newDocument: newArticle,
          sourceStatusUpdate: {
            uuid: timeless.uuid,
            name: 'used',
            version: sourceResponse.version
          },
          accessToken
        })

        const updatedPlanningId = await addAssignmentWithDeliverable({
          planningId: args.targetPlanningId,
          type: 'text',
          deliverableId: newArticle.uuid,
          title: timeless.title ?? '',
          slugline,
          priority: newsvalue ? Number(newsvalue) : undefined,
          publicVisibility: true,
          localDate: args.targetDate,
          // 09:00 UTC mirrors the assignment time the previous conversion used.
          isoDateTime: `${args.targetDate}T09:00:00Z`,
          section
        })

        if (!updatedPlanningId) {
          // addAssignmentWithDeliverable already surfaced an error toast. The
          // article now exists and the timeless is marked used, but it is not
          // yet assigned (same non-atomic window as the Flash/Wire flows).
          return { success: false }
        }

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
                documentId={updatedPlanningId}
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
          newPlanningId: updatedPlanningId
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
