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

  if (version === -1n) {
    return {
      name: 'cancelled',
      version,
      creator: meta.updaterUri
    }
  }

  if (!heads || Object.keys(heads).length === 0) {
    return {
      name: 'draft',
      version,
      creator: meta.creatorUri
    }
  }

  const latest = Object.entries(heads)
    .filter(([key, entry]) => key !== 'currentStatus' && entry.version !== -1n)
    .sort((a, b) => new Date(b[1].created).getTime() - new Date(a[1].created).getTime())[0]

  if (!latest) {
    return {
      name: 'draft',
      version,
      creator: meta.creatorUri
    }
  }

  const [name, entry] = latest

  return {
    name,
    version,
    creator: entry.creator,
    cause: entry.meta?.cause,
    checkpoint: meta.workflowCheckpoint
  }
}
