import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRegistry } from '@/hooks/useRegistry'
import type {
  DocumentUpdate,
  DocumentRemoved,
  InclusionBatch
} from '@ttab/elephant-api/repositorysocket'
import { toast } from 'sonner'
import type { SocketStatus } from '@/shared/RepositorySocket'
import { useTable } from '@/hooks/useTable'
import type { DocumentStateWithDecorators, DecoratorDataBase } from './types'
import {
  findDeliverableParentIndex,
  handleDocumentUpdate,
  handleInclusionBatchUpdate,
  handleRemoved,
  isDocumentRemoved,
  isDocumentUpdate,
  isInclusionBatch,
  ScheduleDecoratorUpdate
} from './lib/handlers'
import type { Decorator } from './types'
import { runInitialDecorators, runUpdateDecorators } from './lib/decoratorRunner'

/**
 * React hook for real-time document synchronization via WebSocket.
 *
 * Fetches documents from the repository socket and keeps them synchronized
 * with live updates. Supports optional decorators for enriching documents
 * with additional data (e.g., metrics, correlations).
 *
 * Features:
 * - Real-time document updates via WebSocket
 * - Automatic cleanup on unmount
 * - Optional decorator system for data enrichment
 * - Table integration support
 *
 * @template TDecoratorData - Namespaced decorator data shape (e.g., MetricsDecorator)
 *
 * @param options - Configuration options
 * @param options.type - Document type to fetch (e.g., 'core/planning-item')
 * @param options.from - Start date for timespan filter (ISO 8601)
 * @param options.to - End date for timespan filter (ISO 8601)
 * @param options.include - Array of include patterns for related documents
 * @param options.subset - Array of subset extraction patterns
 * @param options.preprocessor - Transform function for table data
 * @param options.asTable - Whether to integrate with table context
 * @param options.decorators - Array of decorator functions to enrich documents
 *
 * @returns Object containing:
 * - data: Array of DocumentStateWithDecorators, each with optional decoratorData
 * - error: Error object if fetch failed, null otherwise
 * - isLoading: Boolean indicating if initial fetch is in progress
 * - status: Current socket connection status
 *
 * @example
 * Basic usage:
 * ```typescript
 * const { data, error, isLoading } = useRepositorySocket({
 *   type: 'core/planning-item',
 *   from: '2024-01-01T00:00:00Z',
 *   to: '2024-12-31T23:59:59Z'
 * })
 * ```
 *
 * @example
 * With decorators:
 * ```typescript
 * import { createMetricsDecorator, type MetricsDecorator } from '@/hooks/useRepositorySocket/decorators/metrics'
 *
 * const { data } = useRepositorySocket<MetricsDecorator>({
 *   type: 'core/article',
 *   decorators: [
 *     createMetricsDecorator({ repository, kinds: ['char_count', 'word_count'] })
 *   ]
 * })
 *
 * ```
 */
export function useRepositorySocket<TDecoratorData extends DecoratorDataBase = DecoratorDataBase>({
  from,
  to,
  include,
  subset,
  type,
  asTable = false,
  decorators = [],
  preprocessor
}: {
  from?: string
  to?: string
  type: string
  include?: string[]
  subset?: string[]
  asTable?: boolean
  decorators?: Array<Decorator<object>>
  preprocessor?: (data: DocumentStateWithDecorators<TDecoratorData>[]) => DocumentStateWithDecorators<TDecoratorData>[]
}): {
  data: DocumentStateWithDecorators<TDecoratorData>[]
  error: Error | null
  isLoading: boolean
  status: SocketStatus | null
} {
  const { data: session } = useSession()
  const { repositorySocket } = useRegistry()
  const [data, setData] = useState<DocumentStateWithDecorators<TDecoratorData>[]>([])
  const { setData: setTableData } = useTable()
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [reconnectCount, setReconnectCount] = useState(0)
  const [status, setStatus] = useState<SocketStatus | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)
  const setNameRef = useRef<string>('')
  const callIdRef = useRef<string>('')
  const includeRef = useRef(include)
  const subsetRef = useRef(subset)
  const decoratorsRef = useRef(decorators)
  decoratorsRef.current = decorators
  const accessTokenRef = useRef<string>(session?.accessToken ?? '')
  accessTokenRef.current = session?.accessToken ?? ''
  const dataRef = useRef<DocumentStateWithDecorators<TDecoratorData>[]>([])
  dataRef.current = data
  const schedulerRef = useRef(
    new ScheduleDecoratorUpdate<TDecoratorData>(
      setData, dataRef, decoratorsRef, accessTokenRef, runUpdateDecorators
    )
  )

  // Keep the socket's stored token fresh so reconnects use valid credentials
  useEffect(() => {
    if (!repositorySocket || !session?.accessToken) return

    repositorySocket.updateAccessToken(session.accessToken)

    if (repositorySocket.isConnected && !repositorySocket.isAuthenticated) {
      repositorySocket.authenticate().catch((err) => {
        const error = err instanceof Error ? err : new Error('Authentication failed')
        setError(error)
        toast.error('Kunde inte autentisera anslutningen')
      })
    }
  }, [session?.accessToken, repositorySocket])

  // If asTable is true, sync data with table context
  // Use preprocessor to optimize data for table if provided
  useEffect(() => {
    if (asTable) {
      const processedData = preprocessor ? preprocessor(data) : data
      setTableData(processedData)
    }
  }, [data, asTable, setTableData, preprocessor])

  useEffect(() => {
    if (!repositorySocket) return
    return repositorySocket.onReconnect(() => setReconnectCount((c) => c + 1))
  }, [repositorySocket])

  useEffect(() => {
    if (!repositorySocket) return
    return repositorySocket.onStatusChange(setStatus)
  }, [repositorySocket])

  useEffect(() => {
    if (!repositorySocket || !session?.accessToken || !type) {
      setIsLoading(false)
      setError(new Error('No repository socket, type or session available'))
      return
    }

    let isActive = true
    setIsLoading(true)
    setError(null)

    const fetchDocuments = async () => {
      try {
        if (!repositorySocket.isConnected) {
          await repositorySocket.connect(session.accessToken)
        }

        if (!repositorySocket.isAuthenticated) {
          await repositorySocket.authenticate()
        }

        const setName = `${type}-${Date.now()}`
        setNameRef.current = setName

        const timespan = from && to ? { from, to } : undefined

        const response = await repositorySocket.getDocuments({
          setName,
          type,
          timespan,
          include: includeRef.current,
          subset: subsetRef.current,
          resolveParentIndex: findDeliverableParentIndex
        })

        const { callId, documents, onUpdate } = response
        callIdRef.current = callId

        if (!isActive) return

        let initialData: DocumentStateWithDecorators<TDecoratorData>[]

        if (decoratorsRef.current.length > 0) {
          try {
            initialData = await runInitialDecorators<TDecoratorData>(
              documents,
              decoratorsRef.current,
              session.accessToken
            )
          } catch (err) {
            console.error('Decorator initialization failed:', err)
            toast.error('Kunde inte ladda utökad data')
            initialData = documents as DocumentStateWithDecorators<TDecoratorData>[]
          }
        } else {
          initialData = documents as DocumentStateWithDecorators<TDecoratorData>[]
        }

        if (!isActive) return

        setData(initialData)
        setIsLoading(false)

        const unsubscribe = onUpdate((update) => {
          // Verify both setName and that we're still the active call
          if ('setName' in update && update.setName === setName && callIdRef.current === callId) {
            handleUpdate(update)
          } else {
            console.warn('❌ Update rejected - validation failed')
          }
        })

        cleanupRef.current = unsubscribe
      } catch (err) {
        if (!isActive) return

        const error = err instanceof Error ? err : new Error('Failed to fetch documents')
        console.error('useRepositorySocket error:', error)
        setError(error)
        setIsLoading(false)
        toast.error('Kunde inte hämta dokument')
      }
    }

    const handleUpdate = (update: DocumentUpdate | DocumentRemoved | InclusionBatch) => {
      setData((prevData) => {
        if (isDocumentRemoved(update)) {
          return handleRemoved(prevData, update)
        }

        if (isInclusionBatch(update)) {
          return handleInclusionBatchUpdate(prevData, update)
        }

        if (isDocumentUpdate(update)) {
          return handleDocumentUpdate(
            prevData,
            update,
            schedulerRef.current
          )
        }
        return prevData
      })
    }

    void fetchDocuments()

    const scheduler = schedulerRef.current

    return () => {
      isActive = false
      cleanupRef.current?.()
      scheduler.cleanup()

      if (setNameRef.current && repositorySocket.isConnected) {
        repositorySocket.closeDocumentSet(setNameRef.current).catch((err) => {
          console.warn('Failed to close document set:', err)
        })
      }
    }
  // We dont want to re-run this effect when accessToken changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repositorySocket, from, to, type, asTable, reconnectCount])

  return { data, error, isLoading, status }
}
