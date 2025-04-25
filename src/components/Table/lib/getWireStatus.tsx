import type { Wire } from '@/hooks/index/lib/wires'

type DocumentType = 'Planning' | 'Event' | 'Assignments' | 'Search' | 'Wires' | 'Factbox' | 'PrintArticles' | 'PrintEditor'
export function getWireStatus(type: DocumentType, wire: Wire): 'draft' | 'read' | 'saved' | 'used' | null {
  if (type !== 'Wires') {
    return null
  }

  const read = Number(wire.fields?.['heads.read.version']?.values?.[0]) > -1
    && wire.fields?.['heads.read.created']?.values?.[0]
  const saved = Number(wire.fields?.['heads.saved.version']?.values?.[0]) > -1
    && wire.fields?.['heads.saved.created']?.values?.[0]
  const used = Number(wire.fields?.['heads.used.version']?.values?.[0]) > -1
    && wire.fields?.['heads.used.created']?.values?.[0]

  if ((!read || read === '-1') && (!saved || saved === '-1') && (!used || used === '-1')) {
    return 'draft'
  }

  if (saved || read || used) {
    return saved && (!read || new Date(saved) > new Date(read))
      ? 'saved'
      : read && (!used || new Date(read) > new Date(used))
        ? 'read'
        : 'used'
  }

  return 'draft'
}
