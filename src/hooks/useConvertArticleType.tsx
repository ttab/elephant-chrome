import { useCallback, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRegistry } from './useRegistry'
import { prepareArticleConversion, type ArticleType } from '@/shared/convertArticleType'
import { toast } from 'sonner'

interface ConversionResult {
  success: boolean
  /** UUID of the newly created document (if successful) */
  newDocumentId?: string
  /** UUID of the newly created planning (only when converting timeless → article) */
  newPlanningId?: string
}

interface ConvertOptions {
  /** Required when converting to core/article. Ignored otherwise. */
  targetDate?: string
  /** Optional source planning UUID; falls back to a blank planning when absent. */
  sourcePlanningId?: string
}

interface UseConvertArticleTypeResult {
  convert: (
    documentId: string,
    targetType: ArticleType,
    options?: ConvertOptions
  ) => Promise<ConversionResult>
  isConverting: boolean
}

/**
 * Hook for converting between article types.
 *
 * - `core/article` → `core/article#timeless`: client-side prune + create-new-doc;
 *   source is marked "used" atomically via Repository.createDerivedDocument.
 * - `core/article#timeless` → `core/article`: delegates to the server route
 *   `POST /api/documents/:id/convertToArticle`, which also derives a new planning.
 */
export function useConvertArticleType(): UseConvertArticleTypeResult {
  const { repository } = useRegistry()
  const { data: session } = useSession()
  const [isConverting, setIsConverting] = useState(false)

  const accessToken = session?.accessToken

  const convert = useCallback(async (
    documentId: string,
    targetType: ArticleType,
    options?: ConvertOptions
  ): Promise<ConversionResult> => {
    if (!repository || !accessToken) {
      toast.error('Unable to convert: not authenticated')
      return { success: false }
    }

    setIsConverting(true)

    try {
      if (targetType === 'core/article') {
        if (!options?.targetDate) {
          toast.error('A target date is required to convert to article')
          return { success: false }
        }

        const res = await fetch(`/api/documents/${documentId}/convertToArticle`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetDate: options.targetDate,
            sourcePlanningId: options.sourcePlanningId
          })
        })

        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as
            | { statusMessage?: string }
            | null
          const message = body?.statusMessage || `HTTP ${res.status}`
          toast.error(`Conversion failed: ${message}`)
          return { success: false }
        }

        const payload = (await res.json()) as {
          articleId: string
          planningId: string
        }

        toast.success('Document converted')
        return {
          success: true,
          newDocumentId: payload.articleId,
          newPlanningId: payload.planningId
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
      return { success: true, newDocumentId: newDocument.uuid }
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
