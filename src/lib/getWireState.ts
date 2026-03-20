import type { Wire } from '@/shared/schemas/wire'

export type WireStatusKey = 'read' | 'saved' | 'used' | 'flash' | 'draft'

export type WireState = {
  status: WireStatusKey
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
 * Get the current state of a wire with information about its current status and historical statuses.
 *
 * @param wire {Wire}
 * @returns {WireState}
 */
export function getWireState(wire: Wire): WireState {
  const version = Number.parseInt(wire.fields['current_version'].values[0])
  const flashVersion = Number.parseInt(wire.fields['heads.flash.version']?.values[0])
  const savedVersion = Number.parseInt(wire.fields['heads.saved.version']?.values[0])
  const readVersion = Number.parseInt(wire.fields['heads.read.version']?.values[0])
  const usedVersion = Number.parseInt(wire.fields['heads.used.version']?.values[0])

  // Collect all statuses whose version matches current_version and pick the most recent one
  const candidates: Array<{ key: WireStatusKey, created: string | undefined }> = []
  if (version === usedVersion) {
    candidates.push({ key: 'used', created: wire.fields['heads.used.created']?.values[0] })
  }
  if (version === savedVersion) {
    candidates.push({ key: 'saved', created: wire.fields['heads.saved.created']?.values[0] })
  }
  if (version === readVersion) {
    candidates.push({ key: 'read', created: wire.fields['heads.read.created']?.values[0] })
  }
  if (version === flashVersion) {
    candidates.push({ key: 'flash', created: wire.fields['heads.flash.created']?.values[0] })
  }

  let status: WireStatusKey
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
    wasFlashCreated: wasFlash !== undefined ? wire.fields['heads.flash.created']?.values[0] : undefined,
    wasSaved,
    wasSavedCreated: wasSaved !== undefined ? wire.fields['heads.saved.created']?.values[0] : undefined,
    wasUsed,
    wasUsedCreated: wasUsed !== undefined ? wire.fields['heads.used.created']?.values[0] : undefined,
    wasRead,
    wasReadCreated: wasRead !== undefined ? wire.fields['heads.read.created']?.values[0] : undefined
  }
}
