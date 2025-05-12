type HeadEntry = {
  version: bigint
  created: string
  creator: string
  meta?: {
    cause?: string
  }
}

export type Meta = {
  currentVersion: bigint
  heads?: Record<string, HeadEntry>
  creatorUri: string
  updaterUri: string
  workflowCheckpoint?: string
  workflowState?: string
}

/**
 * Parse meta heads information to retrieve the current status of a document.
 */
export function getStatusFromMeta(meta: Meta): {
  name: string
  version: bigint
  creator: string
  cause?: string
  checkpoint?: string
} {
  const heads = meta.heads
  const version = meta.currentVersion

  // If there are no heads it's always implicitly a 'draft'
  if (!heads || Object.keys(heads).length === 0) {
    return {
      name: 'draft',
      version,
      creator: meta.creatorUri
    }
  }

  const latest = Object.entries(heads)
    .sort((a, b) => new Date(b[1].created).getTime() - new Date(a[1].created).getTime())[0]

  const [name, entry] = latest

  // Use workflow state if it exists, otherwise the latest entry.
  // If latest entry is 'usable' and that version is -1 it is unpublished
  return {
    name: meta.workflowState || (
      (name === 'usable' && entry.version === -1n)
        ? 'unpublished'
        : name
    ),
    version,
    creator: entry.creator,
    cause: entry.meta?.cause,
    checkpoint: meta.workflowCheckpoint
  }
}
