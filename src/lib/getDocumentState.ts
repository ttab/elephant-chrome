import type { HitV1 } from '@ttab/elephant-api/index'
import type { StatusOverviewItem } from '@ttab/elephant-api/repository'

export type StatusKey = undefined | 'read' | 'saved' | 'used' | 'flash' | 'draft'

export type DocumentState = {
  status: StatusKey
  isFlash: boolean
  wasFlash?: number
  wasFlashCreated?: string
  wasSaved?: number
  wasSavedCreated?: string
  wasUsed?: number
  wasUsedCreated?: string
  wasRead?: number
  wasReadCreated?: string
}

/**
 * Get the current state of a document with information about its current status and historical statuses.
 *
 * @param document {HitV1 | StatusOverviewItem}
 * @returns {DocumentState}
 */
export function getDocumentState(document: HitV1 | StatusOverviewItem): DocumentState {
  let version: number
  let savedVersion: number
  let savedVersionCreated: string | undefined
  let flashVersion: number
  let flashVersionCreated: string | undefined
  let readVersion: number
  let readVersionCreated: string | undefined
  let usedVersion: number
  let usedVersionCreated: string | undefined

  if ('fields' in document) {
    version = Number.parseInt(document.fields['current_version'].values[0])
    flashVersion = Number.parseInt(document.fields['heads.flash.version']?.values[0])
    flashVersionCreated = document.fields['heads.flash.created']?.values[0]
    savedVersion = Number.parseInt(document.fields['heads.saved.version']?.values[0])
    savedVersionCreated = document.fields['heads.saved.created']?.values[0]
    readVersion = Number.parseInt(document.fields['heads.read.version']?.values[0])
    readVersionCreated = document.fields['heads.read.created']?.values[0]
    usedVersion = Number.parseInt(document.fields['heads.used.version']?.values[0])
    usedVersionCreated = document.fields['heads.used.created']?.values[0]
  } else {
    version = Number(document.version)
    flashVersion = Number(document.heads['flash']?.version)
    flashVersionCreated = document.heads['flash']?.created
    savedVersion = Number(document.heads['saved']?.version)
    savedVersionCreated = document.heads['saved']?.created
    readVersion = Number(document.heads['read']?.version)
    readVersionCreated = document.heads['read']?.created
    usedVersion = Number(document.heads['usable']?.version)
    usedVersionCreated = document.heads['usable']?.created
  }

  const candidates: Array<{ key: StatusKey, created: string | undefined }> = []
  if (version === usedVersion) {
    candidates.push({ key: 'used', created: usedVersionCreated })
  }
  if (version === savedVersion) {
    candidates.push({ key: 'saved', created: savedVersionCreated })
  }
  if (version === readVersion) {
    candidates.push({ key: 'read', created: readVersionCreated })
  }
  if (version === flashVersion) {
    candidates.push({ key: 'flash', created: flashVersionCreated })
  }

  let status: StatusKey
  if (candidates.length === 0) {
    status = 'draft'
  } else if (candidates.length === 1) {
    status = candidates[0].key
  } else {
    // Multiple statuses on the same version — pick the youngest (most recent timestamp)
    const winner = candidates.reduce((best, candidate) => {
      if (!candidate.created) return best
      if (!best.created) return candidate
      return new Date(candidate.created).getTime() > new Date(best.created).getTime() ? candidate : best
    })
    status = winner.key
  }

  const wasFlash = !isNaN(flashVersion) && version > flashVersion ? flashVersion : undefined
  const wasSaved = !isNaN(savedVersion) && version > savedVersion ? savedVersion : undefined
  const wasUsed = !isNaN(usedVersion) && version > usedVersion ? usedVersion : undefined
  const wasRead = !isNaN(readVersion) && version > readVersion ? readVersion : undefined

  return {
    status,
    isFlash: version === flashVersion,
    wasFlash,
    wasFlashCreated: wasFlash !== undefined ? flashVersionCreated : undefined,
    wasSaved,
    wasSavedCreated: wasSaved !== undefined ? savedVersionCreated : undefined,
    wasUsed,
    wasUsedCreated: wasUsed !== undefined ? usedVersionCreated : undefined,
    wasRead,
    wasReadCreated: wasRead !== undefined ? readVersionCreated : undefined
  }
}
