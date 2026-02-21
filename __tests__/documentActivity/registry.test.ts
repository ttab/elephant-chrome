import { documentActivityRegistry } from '@/lib/documentActivity/registry'
import type { ActivityDefinition } from '@/lib/documentActivity/types'

function makeDefinition(title: string): ActivityDefinition {
  return {
    title,
    viewRouteFunc: (docId) => Promise.resolve({
      viewName: 'Editor',
      props: { id: docId }
    })
  }
}

describe('DocumentActivityRegistry', () => {
  afterEach(() => {
    // Clean up by getting all entries and checking they're gone after unregister
    // Since we can't reset the singleton, we rely on unregister in each test
  })

  it('registers and retrieves entries by document type', () => {
    const def = makeDefinition('Open article')
    const unregister = documentActivityRegistry.register('core/article', 'open', def)

    const entries = documentActivityRegistry.getEntries('core/article')
    expect(entries).toHaveLength(1)
    expect(entries[0].activityId).toBe('open')
    expect(entries[0].definition.title).toBe('Open article')

    unregister()
  })

  it('returns empty array for unregistered document type', () => {
    const entries = documentActivityRegistry.getEntries('core/nonexistent')
    expect(entries).toHaveLength(0)
  })

  it('unregisters entries', () => {
    const def = makeDefinition('Open article')
    const unregister = documentActivityRegistry.register('core/article', 'open', def)

    expect(documentActivityRegistry.getEntries('core/article')).toHaveLength(1)

    unregister()

    expect(documentActivityRegistry.getEntries('core/article')).toHaveLength(0)
  })

  it('matches wildcard entries', () => {
    const def = makeDefinition('View history')
    const unregister = documentActivityRegistry.register('*', 'history', def)

    const articleEntries = documentActivityRegistry.getEntries('core/article')
    expect(articleEntries).toHaveLength(1)
    expect(articleEntries[0].activityId).toBe('history')

    const flashEntries = documentActivityRegistry.getEntries('core/flash')
    expect(flashEntries).toHaveLength(1)

    unregister()
  })

  it('returns both type-specific and wildcard entries', () => {
    const specificDef = makeDefinition('Open article')
    const wildcardDef = makeDefinition('View history')

    const unregister1 = documentActivityRegistry.register('core/article', 'open', specificDef)
    const unregister2 = documentActivityRegistry.register('*', 'history', wildcardDef)

    const entries = documentActivityRegistry.getEntries('core/article')
    expect(entries).toHaveLength(2)

    const ids = entries.map((e) => e.activityId)
    expect(ids).toContain('open')
    expect(ids).toContain('history')

    unregister1()
    unregister2()
  })

  it('replaces registration with same key', () => {
    const def1 = makeDefinition('Open v1')
    const def2 = makeDefinition('Open v2')

    const unregister1 = documentActivityRegistry.register('core/article', 'open', def1)
    const unregister2 = documentActivityRegistry.register('core/article', 'open', def2)

    const entries = documentActivityRegistry.getEntries('core/article')
    expect(entries).toHaveLength(1)
    expect(entries[0].definition.title).toBe('Open v2')

    // Both unregister functions should work, but only unregister2 matters
    unregister1()
    unregister2()
  })

  it('notifies subscribers on register and unregister', () => {
    const listener = vi.fn()
    const unsub = documentActivityRegistry.subscribe(listener)

    const def = makeDefinition('Open article')
    const unregister = documentActivityRegistry.register('core/article', 'open', def)

    expect(listener).toHaveBeenCalledTimes(1)

    unregister()

    expect(listener).toHaveBeenCalledTimes(2)

    unsub()
  })

  it('increments version on changes', () => {
    const v1 = documentActivityRegistry.getVersion()

    const def = makeDefinition('Open article')
    const unregister = documentActivityRegistry.register('core/article', 'open', def)

    const v2 = documentActivityRegistry.getVersion()
    expect(v2).toBeGreaterThan(v1)

    unregister()

    const v3 = documentActivityRegistry.getVersion()
    expect(v3).toBeGreaterThan(v2)
  })

  it('stops notifying after unsubscribe', () => {
    const listener = vi.fn()
    const unsub = documentActivityRegistry.subscribe(listener)

    unsub()

    const def = makeDefinition('Open article')
    const unregister = documentActivityRegistry.register('core/article', 'open', def)

    expect(listener).not.toHaveBeenCalled()

    unregister()
  })
})
