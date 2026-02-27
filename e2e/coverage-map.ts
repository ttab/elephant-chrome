type CoverageStatus = 'covered' | 'partial' | 'uncovered'

interface CoverageEntry {
  tests: string[]
  status: CoverageStatus
}

export const coverageMap: Record<string, CoverageEntry> = {
  // Tier 1 — Critical Path
  'auth/login': {
    tests: ['auth/login.spec.ts'],
    status: 'covered'
  },
  'editor/basic-editing': {
    tests: ['editor/basic-editing.spec.ts'],
    status: 'covered'
  },
  'editor/formatting': {
    tests: ['editor/formatting.spec.ts'],
    status: 'covered'
  },
  'editor/status-workflow': {
    tests: ['editor/status-workflow.spec.ts'],
    status: 'covered'
  },
  'editor/metadata': {
    tests: ['editor/metadata.spec.ts'],
    status: 'covered'
  },
  'editor/collaboration': {
    tests: ['editor/collaboration.spec.ts'],
    status: 'covered'
  },
  'planning/create': {
    tests: ['planning/create-planning.spec.ts'],
    status: 'covered'
  },
  'planning/edit': {
    tests: ['planning/edit-planning.spec.ts'],
    status: 'covered'
  },
  'planning/assignments': {
    tests: ['planning/assignments.spec.ts'],
    status: 'covered'
  },
  'flash/create': {
    tests: ['flash/create-flash.spec.ts'],
    status: 'covered'
  },

  // Tier 2 — Important Workflows
  'event/create': {
    tests: ['event/create-event.spec.ts'],
    status: 'covered'
  },
  'event/edit': {
    tests: ['event/edit-event.spec.ts'],
    status: 'covered'
  },
  'overviews/planning': {
    tests: ['overviews/planning-overview.spec.ts'],
    status: 'covered'
  },
  'overviews/events': {
    tests: ['overviews/events-overview.spec.ts'],
    status: 'covered'
  },
  'overviews/factboxes': {
    tests: ['overviews/factboxes-overview.spec.ts'],
    status: 'covered'
  },
  'approvals/grid': {
    tests: ['approvals/approvals-grid.spec.ts'],
    status: 'covered'
  },
  'assignments/table': {
    tests: ['assignments/assignments-table.spec.ts'],
    status: 'covered'
  },
  'search/overview': {
    tests: ['search/search.spec.ts'],
    status: 'covered'
  },

  // Tier 3 — Secondary Flows
  'quick-article/create': {
    tests: ['quick-article/create-quick-article.spec.ts'],
    status: 'covered'
  },
  'factbox/create': {
    tests: ['factbox/create-factbox.spec.ts'],
    status: 'covered'
  },
  'wires/list': {
    tests: ['wires/wire-list.spec.ts'],
    status: 'covered'
  },
  'latest/articles': {
    tests: ['latest/latest-articles.spec.ts'],
    status: 'covered'
  },

  // Tier 4 — Print
  'print/editor': {
    tests: ['print/print-editor.spec.ts'],
    status: 'covered'
  },
  'print/articles': {
    tests: ['print/print-articles.spec.ts'],
    status: 'covered'
  },

  // Image Search
  'image-search': {
    tests: ['image-search/image-search.spec.ts'],
    status: 'covered'
  }
} as const
