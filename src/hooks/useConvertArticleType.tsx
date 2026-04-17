import { useCallback, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRegistry } from './useRegistry'
import { prepareArticleConversion } from '@/shared/convertArticleType'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { CalendarDaysIcon, PenBoxIcon } from '@ttab/elephant-ui/icons'
import { ToastAction } from '@/components/ToastAction'

const BASE_URL = import.meta.env.BASE_URL || ''

export type ConvertArgs
  = | { targetType: 'core/article#timeless' }
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
      warnings: string[]
    }

interface UseConvertArticleTypeResult {
  convert: (documentId: string, args: ConvertArgs) => Promise<ConversionResult>
  isConverting: boolean
}

/**
 * Converts an article between its regular and timeless variants. The
 * timeless→article direction delegates to the server because it also needs to
 * derive a new planning; the reverse direction stays client-side.
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
        const res = await fetch(`${BASE_URL}/api/documents/${documentId}/convertToArticle`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetDate: args.targetDate,
            sourcePlanningId: args.sourcePlanningId
          })
        })

        const payload = (await res.json().catch(() => null)) as
          | {
            articleId?: string
            planningId?: string
            warnings?: string[]
            error?: string
            statusMessage?: string
          }
          | null

        if (!res.ok || !payload?.articleId || !payload?.planningId) {
          const message = payload?.error
            ?? payload?.statusMessage
            ?? `HTTP ${res.status}`
          if (payload?.articleId && !payload.planningId) {
            console.warn(
              `Orphan article created during failed conversion: ${payload.articleId}`
            )
          }
          toast.error(t('views:timeless.toasts.conversionFailed', { message }))
          return { success: false }
        }

        const warnings = payload.warnings ?? []
        const title = warnings.includes('source-not-marked-used')
          ? t('views:timeless.toasts.convertedSourceNotMarkedUsed')
          : t('views:timeless.toasts.convertedSuccess')

        toast.success(title, {
          action: (
            <div className='flex gap-1'>
              <ToastAction
                documentId={payload.articleId}
                withView='Editor'
                label={t('views:timeless.toasts.openArticle')}
                Icon={PenBoxIcon}
                target='last'
              />
              <ToastAction
                documentId={payload.planningId}
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
          newDocumentId: payload.articleId,
          newPlanningId: payload.planningId,
          warnings
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

      const { newDocument, sourceUuid, errors } = await prepareArticleConversion(
        response.document,
        'core/article#timeless',
        repository,
        accessToken
      )

      if (errors.length > 0) {
        console.warn('Conversion pruning warnings:', errors)
      }

      await repository.createDerivedDocument({
        newDocument,
        sourceUuid,
        accessToken
      })

      toast.success(t('views:timeless.toasts.convertedSuccess'), {
        action: (
          <ToastAction
            documentId={newDocument.uuid}
            withView='Editor'
            label={t('views:timeless.toasts.openArticle')}
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
