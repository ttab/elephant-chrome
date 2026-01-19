import type { Wire } from '@/shared/schemas/wire'

type DocumentType = 'Planning' | 'Event' | 'Assignments' | 'Search' | 'Wires' | 'Factbox' | 'Print' | 'PrintEditor'
export function getWireStatus(type: DocumentType, wire: Wire): 'draft' | 'read' | 'saved' | 'used' | null {
  if (type !== 'Wires') {
    return null
  }

  const statusFields = [
    { key: 'read', created: wire.fields?.['heads.read.created']?.values?.[0], version: wire.fields?.['heads.read.version']?.values?.[0] },
    { key: 'saved', created: wire.fields?.['heads.saved.created']?.values?.[0], version: wire.fields?.['heads.saved.version']?.values?.[0] },
    { key: 'used', created: wire.fields?.['heads.used.created']?.values?.[0], version: wire.fields?.['heads.used.version']?.values?.[0] }
  ]

  // Only consider statuses with version >= 1 and valid timestamp
  const validStatuses = statusFields
    .filter((s) => s.created && s.version && Number(s.version) >= 1)
    .map((s) => ({
      key: s.key,
      timestamp: new Date(s.created).getTime()
    }))
    .filter((s) => !isNaN(s.timestamp))

  if (validStatuses.length === 0) {
    return 'draft'
  }

  // Find the status with the most recent timestamp
  const mostRecent = validStatuses.reduce((a, b) =>
    (b.timestamp > a.timestamp ? b : a))

  return mostRecent.key as 'read' | 'saved' | 'used'
}
