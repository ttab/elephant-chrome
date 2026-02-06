import type { Wire } from '@/shared/schemas/wire'

type WireStatus = 'draft' | 'read' | 'saved' | 'used' | 'flash'
export function getWireStatuses(wire: Wire): Array<{
  key: WireStatus
  version: string
  created: number
}> {
  const currentVersion = wire.fields?.['current_version']?.values?.[0]
  const statusFields = [
    { key: 'read', created: wire.fields?.['heads.read.created']?.values?.[0], version: wire.fields?.['heads.read.version']?.values?.[0] },
    { key: 'saved', created: wire.fields?.['heads.saved.created']?.values?.[0], version: wire.fields?.['heads.saved.version']?.values?.[0] },
    { key: 'used', created: wire.fields?.['heads.used.created']?.values?.[0], version: wire.fields?.['heads.used.version']?.values?.[0] },
    { key: 'flash', created: wire.fields?.['heads.flash.created']?.values?.[0], version: wire.fields?.['heads.flash.version']?.values?.[0] }
  ]

  // Get the first created status timestamp
  const created = statusFields.reduce((min, s) => s.created ? Math.min(min, new Date(s.created).getTime()) : min, Infinity)
  const modified = wire.fields?.['modified']?.values?.[0]

  // Only consider statuses with version >= 1 and valid timestamp
  const validStatuses = statusFields
    .filter((s) => s.created && s.version && Number(s.version) >= 1)
    .map((s) => ({
      key: s.key as WireStatus,
      version: s.version,
      created: new Date(s.created).getTime()
    }))
    .filter((s) => !isNaN(s.created))

  if (validStatuses.length === 0) {
    return [{
      key: 'draft',
      version: '1',
      created: created || new Date(modified).getTime()
    }]
  }

  const sorted = validStatuses.sort((a, b) => b.created - a.created)

  if (sorted[0].version === currentVersion) {
    return sorted
  } else {
    return [{
      key: 'draft',
      version: currentVersion,
      created: new Date(modified).getTime()
    }, ...sorted]
  }
}
