import { useCallback, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRegistry } from './useRegistry'
import { prepareArticleConversion, type ArticleType } from '@/shared/convertArticleType'
import { toast } from 'sonner'

interface ConversionResult {
  success: boolean
  /** UUID of the newly created document (if successful) */
  newDocumentId?: string
}

interface UseConvertArticleTypeResult {
  convert: (documentId: string, targetType: ArticleType) => Promise<ConversionResult>
  isConverting: boolean
}

/**
 * Hook for converting between article types (article <-> timeless).
 *
 * Conversion creates a NEW document from the source:
 * 1. Prunes the source for the target type (removes invalid blocks)
 * 2. Creates a new document with fresh UUID
 * 3. Sets the source document status to "used"
 *
 * Both operations happen atomically via bulkUpdate.
 */
export function useConvertArticleType(): UseConvertArticleTypeResult {
  const { repository } = useRegistry()
  const { data: session } = useSession()
  const [isConverting, setIsConverting] = useState(false)

  const convert = useCallback(async (
    documentId: string,
    targetType: ArticleType
  ): Promise<ConversionResult> => {
    if (!repository || !session?.accessToken) {
      toast.error('Unable to convert: not authenticated')
      return { success: false }
    }

    setIsConverting(true)

    try {
      // Fetch the source document
      const response = await repository.getDocument({
        uuid: documentId,
        accessToken: session.accessToken
      })

      if (!response?.document) {
        toast.error('Document not found')
        return { success: false }
      }

      // Prepare the conversion (prune + create new document structure)
      const { newDocument, sourceUuid, errors } = await prepareArticleConversion(
        response.document,
        targetType,
        repository,
        session.accessToken
      )

      // Log any pruning warnings (these are informational, not blockers)
      if (errors.length > 0) {
        console.warn('Conversion pruning warnings:', errors)
      }

      // Atomically create new document and mark source as "used"
      await repository.createDerivedDocument({
        newDocument,
        sourceUuid,
        accessToken: session.accessToken
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
  }, [repository, session?.accessToken])

  return { convert, isConverting }
}
