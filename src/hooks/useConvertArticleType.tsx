import { useCallback, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRegistry } from './useRegistry'
import { convertArticleType, type ArticleType } from '@/shared/convertArticleType'
import { toast } from 'sonner'

interface UseConvertArticleTypeResult {
  convert: (documentId: string, targetType: ArticleType) => Promise<boolean>
  isConverting: boolean
}

export function useConvertArticleType(): UseConvertArticleTypeResult {
  const { repository } = useRegistry()
  const { data: session } = useSession()
  const [isConverting, setIsConverting] = useState(false)

  const convert = useCallback(async (documentId: string, targetType: ArticleType) => {
    if (!repository || !session?.accessToken) {
      toast.error('Unable to convert: not authenticated')
      return false
    }

    setIsConverting(true)

    try {
      const response = await repository.getDocument({
        uuid: documentId,
        accessToken: session.accessToken
      })

      if (!response?.document) {
        toast.error('Document not found')
        return false
      }

      const { document: prunedDoc, errors } = await convertArticleType(
        response.document,
        targetType,
        repository,
        session.accessToken
      )

      if (errors.length > 0) {
        const errorMessages = errors.map((e) => e.error).join(', ')
        toast.error(`Conversion errors: ${errorMessages}`)
        return false
      }

      await repository.saveDocument(
        prunedDoc,
        session.accessToken
      )

      toast.success('Document converted')
      return true
    } catch (err) {
      console.error('Article type conversion failed:', err)
      const message = err instanceof Error ? err.message : 'Unknown error'
      toast.error(`Conversion failed: ${message}`)
      return false
    } finally {
      setIsConverting(false)
    }
  }, [repository, session?.accessToken])

  return { convert, isConverting }
}
