import type { Wire } from '@/shared/schemas/wire'

type WireStatusKey = undefined | 'read' | 'saved' | 'used'

type WireState = {
  status: WireStatusKey
  isFlash: boolean
  wasFlash: boolean
  wasSaved: boolean
  wasUsed: boolean
  wasRead: boolean
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

  let status: WireStatusKey
  if (version === readVersion) {
    status = 'read'
  } else if (version === savedVersion) {
    status = 'saved'
  } else if (version === usedVersion) {
    status = 'used'
  }

  return {
    status,
    isFlash: version === flashVersion,
    wasFlash: !isNaN(flashVersion) && version > flashVersion,
    wasSaved: !isNaN(savedVersion) && version > savedVersion,
    wasUsed: !isNaN(usedVersion) && version > usedVersion,
    wasRead: !isNaN(readVersion) && version > readVersion
  }
}
