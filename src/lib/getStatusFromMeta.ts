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
export function getStatusFromMeta(meta: Meta, isWorkflow: boolean): {
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

  // If document type is a deliverable, core/article, core/flash, core/editorial-info or
  // core/print-article it's considered a workflow and should use the workflow state.
  //
  // Documents with other types is not a workflow and should use the workflow checkpoint instead.
  // core/planning-item, core/event
  // Unpublished documents are now a valid workflow state and workflow checkpoint and we don't
  // need to check for them specifically.
  let flow
  if (isWorkflow) {
    flow = meta.workflowState
  } else {
    flow = meta.workflowCheckpoint || meta.workflowState
  }

  return {
    name: flow || name,
    version,
    creator: entry.creator,
    cause: entry.meta?.cause,
    checkpoint: meta.workflowCheckpoint
  }
}
