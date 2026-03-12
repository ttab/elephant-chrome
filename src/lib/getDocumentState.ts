import type { HitV1 } from '@ttab/elephant-api/index'
import type { StatusOverviewItem } from '@ttab/elephant-api/repository'

type StatusKey = undefined | 'read' | 'saved' | 'used'

export type DocumentState = {
  status: StatusKey
  isFlash: boolean
  wasFlash?: number
  wasSaved?: number
  wasUsed?: number
  wasRead?: number
}

/**
 * Get the current state of a document with information about its current status and historical statuses.
 *
 * @param document {HitV1 | StatusOverviewItem}
 * @returns {DocumentState}
 */
export function getDocumentState(document: HitV1 | StatusOverviewItem): DocumentState {
  console.log(document)
  let version: number
  let savedVersion: number
  let flashVersion: number
  let readVersion: number
  let usedVersion: number
  if ('fields' in document) {
    version = Number.parseInt(document.fields['current_version'].values[0])
    flashVersion = Number.parseInt(document.fields['heads.flash.version']?.values[0])
    savedVersion = Number.parseInt(document.fields['heads.saved.version']?.values[0])
    readVersion = Number.parseInt(document.fields['heads.read.version']?.values[0])
    usedVersion = Number.parseInt(document.fields['heads.used.version']?.values[0])
  } else {
    version = Number(document.version)
    flashVersion = document.heads['flash']?.version ? Number(document.heads['flash'].version) : NaN
    savedVersion = document.heads['saved']?.version ? Number(document.heads['saved'].version) : NaN
    readVersion = document.heads['read']?.version ? Number(document.heads['read'].version) : NaN
    usedVersion = document.heads['usable']?.version ? Number(document.heads['usable'].version) : NaN
  }

  let status: StatusKey
  if (version === usedVersion) {
    status = 'used'
  } else if (version === savedVersion) {
    status = 'saved'
  } else if (version === readVersion) {
    status = 'read'
  }

  return {
    status,
    isFlash: version === flashVersion,
    wasFlash: !isNaN(flashVersion) && version > flashVersion ? flashVersion : undefined,
    wasSaved: !isNaN(savedVersion) && version > savedVersion ? savedVersion : undefined,
    wasUsed: !isNaN(usedVersion) && version > usedVersion ? usedVersion : undefined,
    wasRead: !isNaN(readVersion) && version > readVersion ? readVersion : undefined
  }
}
