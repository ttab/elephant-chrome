import { useRegistry } from '@/hooks/useRegistry'
import type { BulkGetItem } from '@ttab/elephant-api/repository'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { dateToReadableDateTime } from '@/shared/datetime'
import { HistoryEntry } from './HistoryEntry'
import type { WireState } from '@/lib/getWireState'

interface VersionEntry {
  version: bigint
  created: string
}

function getStatusForVersion(version: bigint, currentVersion: bigint | undefined, wireState?: WireState): string | null {
  if (!wireState) return null
  const n = Number(version)

  if (version === currentVersion) {
    // Flash takes visual priority over other statuses
    if (wireState.isFlash) return 'flash'
    return wireState.status ?? null
  }

  // Past versions: flash takes priority, then status in descending importance
  if (wireState.wasFlash === n) return 'flash'
  if (wireState.wasUsed === n) return 'used'
  if (wireState.wasSaved === n) return 'saved'
  if (wireState.wasRead === n) return 'read'
  return null
}

const COLLAPSED_MAX = 4
const COLLAPSE_THRESHOLD = 5

export const DocumentHistory = ({ uuid, currentVersion, wireState, onSelectVersion, selectedVersion }: {
  uuid: string
  currentVersion?: bigint
  wireState?: WireState
  onSelectVersion: (version: bigint) => void
  selectedVersion: bigint | undefined
}) => {
  const { repository, locale, timeZone } = useRegistry()
  const { data: session } = useSession()
  const [history, setHistory] = useState<VersionEntry[] | null>(null)
  const [documents, setDocuments] = useState<BulkGetItem[] | null>(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    if (!repository || !session?.accessToken) {
      return
    }

    const c1 = new AbortController()
    const c2 = new AbortController()
    const pending = {
      history: true,
      documents: false
    }

    const fetchData = async () => {
      try {
        const result = await repository.getHistory({
          accessToken: session.accessToken,
          uuid,
          abort: c1.signal
        })

        pending.history = false

        if (!result?.versions?.length) {
          setHistory(null)
          setDocuments(null)
          return
        }

        // One entry per version, newest first
        const history: VersionEntry[] = [...result.versions]
          .sort((a, b) => (a.version < b.version ? 1 : a.version > b.version ? -1 : 0))
          .map((v) => ({ version: v.version, created: v.created }))

        pending.documents = true
        const documents = await repository.getDocuments({
          documents: history.map((entry) => ({ uuid, version: entry.version })),
          accessToken: session.accessToken,
          abort: c2.signal
        })

        pending.documents = false

        setHistory(history)
        setDocuments(documents?.items ?? null)
      } catch (error) {
        pending.history = false
        pending.documents = false
        console.error(error)
      }
    }

    void fetchData()

    return () => {
      if (pending.history) c1.abort()
      if (pending.documents) c2.abort()
    }
  }, [uuid, repository, session])

  const isCollapsible = (history?.length ?? 0) > COLLAPSE_THRESHOLD
  const visibleHistory = history && isCollapsible && !showAll
    ? history.slice(0, COLLAPSED_MAX)
    : history

  return (
    <div className='flex flex-col gap-0 text-sm text-muted-foreground'>
      <div className='grid grid-cols-[auto_auto_1fr] gap-0'>
        {visibleHistory?.length
          && visibleHistory.map((item, index) => {
            const title = documents?.find((doc) => doc.version === item.version)?.document?.title
            const isCurrent = item.version === currentVersion
            const status = getStatusForVersion(item.version, currentVersion, wireState)

            return (
              <HistoryEntry
                key={`${item.version}`}
                version={item.version}
                status={status}
                title={title}
                isLast={index === visibleHistory.length - 1}
                isCurrent={isCurrent}
                time={dateToReadableDateTime(new Date(item.created), locale.code.short, timeZone)}
                onSelect={onSelectVersion}
                selected={selectedVersion === item.version || (!selectedVersion && isCurrent)}
              />
            )
          })}
      </div>

      {isCollapsible && (
        <button
          type='button'
          onMouseDownCapture={(event) => {
            event.preventDefault()
            setShowAll((prev) => !prev)
          }}
          className='mt-1 text-xs text-muted-foreground/70 hover:text-foreground transition-colors text-left cursor-pointer'
        >
          {showAll
            ? 'Visa färre'
            : `Visa alla ${history?.length ?? 0}...`}
        </button>
      )}
    </div>
  )
}
