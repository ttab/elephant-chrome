import { describe, it, expect } from 'vitest'
import { fromGroupedNewsDoc, toGroupedNewsDoc } from '@/shared/transformations/groupedNewsDoc'
import { Block, Document } from '@ttab/elephant-api/newsdoc'

describe('cleanup repro', () => {
  it('strips empty slugline from new assignment', () => {
    const planningDoc = Document.create({
      uuid: 'planning-uuid',
      type: 'core/planning-item',
      uri: 'core://newscoverage/planning-uuid',
      title: 'Test Planning',
      meta: [
        Block.create({ type: 'core/planning-item', data: { start_date: '2026-04-29', end_date: '2026-04-29', tentative: 'false' } }),
        Block.create({ type: 'core/newsvalue', value: '4' }),
        Block.create({ type: 'tt/slugline', value: 'existing-planning-slug' }),
        Block.create({ type: 'core/description', role: 'public', data: { text: 'pub' } }),
        Block.create({ type: 'core/description', role: 'internal', data: { text: 'int' } }),
        Block.create({
          type: 'core/assignment',
          data: { full_day: 'true', start_date: '2026-04-29', end_date: '2026-04-29' },
          meta: [
            Block.create({ type: 'tt/slugline', value: 'existing-asgmt-slug' }),
            Block.create({ type: 'core/description', role: 'internal', data: { text: '' } }),
            Block.create({ type: 'core/assignment-type', value: 'text' })
          ]
        }),
        Block.create({
          type: 'core/assignment',
          data: { full_day: 'true', start_date: '2026-04-29', end_date: '2026-04-29' },
          meta: [
            Block.create({ type: 'tt/slugline', value: '' }),
            Block.create({ type: 'core/description', role: 'internal', data: { text: '' } }),
            Block.create({ type: 'core/assignment-type', value: 'text' })
          ]
        })
      ]
    })

    const grouped = toGroupedNewsDoc({ document: planningDoc, version: 1n, isMetaDocument: false, mainDocument: '', subset: [] })
    const result = fromGroupedNewsDoc(grouped)

    const assignments = result.document.meta.filter(b => b.type === 'core/assignment')
    console.log('Assignment count:', assignments.length)
    assignments.forEach((a, i) => {
      const sluglines = a.meta.filter(m => m.type === 'tt/slugline')
      console.log(`Asgmt ${i} meta:`, a.meta.map(m => `${m.type}=${JSON.stringify(m.value || m.data?.text || '')}`).join(' | '))
      console.log(`Asgmt ${i} sluglines:`, sluglines.length === 0 ? '(none — stripped)' : sluglines.map(s => `value=${JSON.stringify(s.value)}`).join(', '))
    })

    const planningSluglines = result.document.meta.filter(b => b.type === 'tt/slugline')
    console.log('\nPlanning sluglines:', planningSluglines.map(s => `value=${JSON.stringify(s.value)}`).join(', ') || '(none)')

    // Expect: new assignment's empty slugline is stripped
    const newAssignment = assignments[1]
    const newSluglines = newAssignment.meta.filter(m => m.type === 'tt/slugline')
    expect(newSluglines.length).toBe(0)
  })
})
