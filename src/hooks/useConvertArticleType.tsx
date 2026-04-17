import { useCallback, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRegistry } from './useRegistry'
import { prepareArticleConversion } from '@/shared/convertArticleType'
import { toast } from 'sonner'

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
  const [isConverting, setIsConverting] = useState(false)
  const accessToken = session?.accessToken

  const convert = useCallback(async (
    documentId: string,
    args: ConvertArgs
  ): Promise<ConversionResult> => {
    if (!repository || !accessToken) {
      toast.error('Unable to convert: not authenticated')
      return { success: false }
    }

    setIsConverting(true)

    try {
      if (args.targetType === 'core/article') {
        const res = await fetch(`/api/documents/${documentId}/convertToArticle`, {
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
          toast.error(`Conversion failed: ${message}`)
          return { success: false }
        }

        const warnings = payload.warnings ?? []
        if (warnings.includes('source-not-marked-used')) {
          toast.warning('Converted, but source status could not be updated')
        } else {
          toast.success('Document converted')
        }

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
        toast.error('Document not found')
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

      toast.success('Document converted')
      return {
        success: true,
        kind: 'timeless',
        newDocumentId: newDocument.uuid
      }
    } catch (err) {
      console.error('Article type conversion failed:', err)
      const message = err instanceof Error ? err.message : 'Unknown error'
      toast.error(`Conversion failed: ${message}`)
      return { success: false }
    } finally {
      setIsConverting(false)
    }
  }, [repository, accessToken])

  return { convert, isConverting }
}
