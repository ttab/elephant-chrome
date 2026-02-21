import { render, screen } from '@testing-library/react'
import { AuthorNames, authorOutput } from '../src/views/Approvals/AuthorNames'
import type { IDBAuthor } from '../src/datastore/types'
import type { PreprocessedApprovalData } from '../src/views/Approvals/preprocessor'
import { Block, Document } from '@ttab/elephant-api/newsdoc'
import { DocumentMeta } from '@ttab/elephant-api/repository'

vi.mock('@/hooks/useAuthors', () => ({
  useAuthors: () => [
    { id: '123', name: 'Alice Johnson', firstName: 'Alice', lastName: 'Johnson', initials: 'AAJ', email: 'aj@example.com', sub: 'core://user/0001' },
    { id: '234', name: 'Bob Lee', firstName: 'Bob', lastName: 'Lee', email: 'bl@example.com', sub: 'core://user/0002' },
    { id: '345', name: 'Christine King', firstName: 'Christine', lastName: 'King', initials: 'CK', email: 'ck@example.com', sub: 'core://user/0003' }
  ]
}))

const statusData = DocumentMeta.create({
  modified: '2025-09-15T13:42:38Z',
  created: '2025-09-15T11:07:32Z',
  heads: {
    approved: {
      id: 1n,
      creator: 'core://user/0002',
      created: '2025-09-15T13:42:38Z',
      metaDocVersion: 11n
    },
    done: {
      id: 1n,
      creator: 'core://user/0001',
      created: '2025-09-15T11:07:32Z',
      metaDocVersion: 4n
    }
  },
  creatorUri: 'core://user/0001',
  updaterUri: 'core://user/0002',
  workflowState: 'approved'
})

const statusDataDone = DocumentMeta.create({
  modified: '2025-10-09T07:58:06Z',
  heads: {
    done: {
      id: 2n,
      creator: 'core://user/0001',
      created: '2025-10-09T07:58:06Z',
      metaDocVersion: 3n
    },
    draft: {
      id: 1n,
      creator: 'core://user/0001',
      created: '2025-10-09T07:58:02Z',
      metaDocVersion: 3n
    }
  },
  workflowState: 'done',
  creatorUri: 'core://user/0001',
  updaterUri: 'core://user/0001'
})

const statusDataCreator = DocumentMeta.create({
  modified: '2025-10-09T07:53:52Z',
  workflowState: 'draft',
  creatorUri: 'core://user/0002',
  updaterUri: 'core://user/0002'
})

const statusDataStatusAfterDraft = DocumentMeta.create({
  modified: '2025-10-09T08:22:31Z',
  heads: {
    approved: {
      id: 2n,
      creator: 'core://user/0002',
      created: '2025-10-09T08:22:31Z',
      metaDocVersion: 0n
    },
    draft: {
      id: 1n,
      creator: 'core://user/0001',
      created: '2025-10-09T08:22:26Z',
      metaDocVersion: 0n
    }
  },
  workflowState: 'approved',
  creatorUri: 'core://user/0001',
  updaterUri: 'core://user/0001'
})

const statusDataCreatorApproved = DocumentMeta.create({
  modified: '2025-10-09T08:22:31Z',
  heads: {
    approved: {
      id: 3n,
      creator: 'core://user/0002',
      created: '2025-10-09T08:22:31Z',
      metaDocVersion: 0n
    },
    done: {
      id: 2n,
      creator: 'core://user/0001',
      created: '2025-10-09T08:22:31Z',
      metaDocVersion: 0n
    },
    draft: {
      id: 1n,
      creator: 'core://user/0001',
      created: '2025-10-09T08:22:26Z',
      metaDocVersion: 0n
    }
  },
  workflowState: 'approved',
  creatorUri: 'core://user/0001',
  updaterUri: 'core://user/0001'
})

const statusDataBylineApproved = DocumentMeta.create({
  modified: '2025-10-09T08:21:19Z',
  heads: {
    approved: {
      id: 1n,
      creator: 'core://user/0001',
      created: '2025-10-09T08:21:19Z',
      metaDocVersion: 0n
    }
  },
  workflowState: 'approved',
  creatorUri: 'core://user/0001',
  updaterUri: 'core://user/0001'
})

const statusDataBylineDone = DocumentMeta.create({
  modified: '2025-10-09T08:17:25Z',
  heads: {
    done: {
      id: 2n,
      creator: 'core://user/0001',
      created: '2025-10-09T08:17:25Z',
      meta: {},
      metaDocVersion: 2n
    },
    draft: {
      id: 1n,
      creator: 'core://user/0001',
      created: '2025-10-09T08:17:20Z',
      meta: {},
      metaDocVersion: 2n
    }
  },
  workflowState: 'done',
  creatorUri: 'core://user/0001',
  updaterUri: 'core://user/0001'
})

const statusDataBylineCreator = DocumentMeta.create({
  modified: '2025-10-09T07:59:03Z',
  heads: {},
  workflowState: 'draft',
  creatorUri: 'core://user/0001',
  updaterUri: 'core://user/0001'
})


const byline = Block.create({
  type: 'core/author',
  title: 'John Doe',
  rel: 'author'
})

const approvalItem = (byline?: Block, meta?: DocumentMeta): PreprocessedApprovalData => ({
  _assignment: Block.create({
    id: 'assignment-123',
    type: 'core/assignment',
    links: [
      {
        type: 'core/author',
        title: 'John Doe',
        rel: 'assignee',
        role: 'primary'
      }
    ]
  }),
  _deliverable: {
    id: 'deliverable-123',
    status: 'approved',
    type: 'core/article',
    document: Document.create({
      type: 'core/article',
      links: [
        {
          uri: 'tt://content-source/tt',
          type: 'core/content-source',
          title: 'TT',
          rel: 'source'
        },
        ...(byline ? [byline] : [])
      ]
    }),
    meta
  },
  id: 'planning-123-assignment-123',
  _preprocessed: {
    planningId: 'planning-123',
    planningTitle: 'Planning Title'
  }
} as PreprocessedApprovalData)

describe('authorOutput', () => {
  it('returns first letters of first and last name', () => {
    const author: IDBAuthor = {
      id: '123',
      name: 'Alice Johnson',
      firstName: 'Alice',
      lastName: 'Johnson',
      initials: '',
      email: 'aj@example.com',
      sub: 'core://user/001'
    }
    expect(authorOutput(author)).toBe('AJ')
  })
})

describe('AuthorNames', () => {
  it('renders byline', () => {
    const item = approvalItem(byline)

    render(
      <AuthorNames item={item} />
    )
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('renders from doneStatus if no byline', () => {
    const item = approvalItem(undefined, statusData)
    render(
      <AuthorNames item={item} />
    )
    expect(screen.getByText(/AJ/)).toBeInTheDocument()
  })

  it('renders byline and lastStatusUpdateAuthor', () => {
    const item = approvalItem(byline, statusData)
    render(
      <AuthorNames item={item} />
    )
    expect(screen.getByText(/John Doe/)).toBeInTheDocument()
    expect(screen.getByText(/BL/)).toBeInTheDocument()
  })

  it('renders from doneStatus if no byline and lastStatusUpdateAuthor', () => {
    const item = approvalItem(undefined, statusData)

    render(
      <AuthorNames item={item} />
    )
    expect(screen.getByText(/BL/)).toBeInTheDocument()
    expect(screen.getByText(/AJ/)).toBeInTheDocument()
  })

  it('renders initials for assignees with afterDraftAuthor and lastStatusUpdateAuthor', () => {
    const item = approvalItem(undefined, statusData)
    render(
      <AuthorNames item={item} />
    )
    expect(screen.getByText(/AJ/)).toBeInTheDocument()
    expect(screen.getByText(/BL/)).toBeInTheDocument()
  })
})

describe('AuthorNames with various statusData assert tooltip', () => {
  it('renders correctly with statusDataDone', () => {
    const item = approvalItem(undefined, statusDataDone)
    render(<AuthorNames item={item} />)

    // Should only show whoever sat status done
    expect(screen.getByTitle('Klar av Alice Johnson'))
  })

  it('renders correctly with statusDataCreator', () => {
    const item = approvalItem(undefined, statusDataCreator)
    render(<AuthorNames item={item} />)

    // Should only show document creator
    expect(screen.getByTitle('Skapad av Bob Lee'))
  })

  it('renders correctly with statusDataStatusAfterDraft', () => {
    const item = approvalItem(undefined, statusDataStatusAfterDraft)
    render(<AuthorNames item={item} />)

    // Should show who set status after draft and last status (in this case the same status)
    expect(screen.getByTitle('Av Bob Lee, Godkänd av Bob Lee')).toBeInTheDocument()
  })

  it('renders correctly with statusDataCreatorApproved', () => {
    const item = approvalItem(undefined, statusDataCreatorApproved)
    render(<AuthorNames item={item} />)

    // Should show who set status
    expect(screen.getByTitle('Klar av Alice Johnson, Godkänd av Bob Lee')).toBeInTheDocument()
  })

  describe('handles byline', () => {
    it('renders correctly with statusDataBylineCreator', () => {
      const item = approvalItem(byline, statusDataBylineCreator)
      render(<AuthorNames item={item} />)

      // Should only show byline, no status
      expect(screen.getByTitle('Byline John Doe')).toBeInTheDocument()
    })

    it('renders correctly with statusDataBylineApproved', () => {
      const item = approvalItem(byline, statusDataBylineApproved)
      render(<AuthorNames item={item} />)

      // Should show byline and approved by
      expect(screen.getByTitle('Byline John Doe, Godkänd av Alice Johnson')).toBeInTheDocument()
    })

    it('renders correctly with statusDataBylineDone', () => {
      const item = approvalItem(byline, statusDataBylineDone)
      render(<AuthorNames item={item} />)
      expect(screen.getByTitle('Byline John Doe')).toBeInTheDocument()
    })

    it('renders byline text content with statusDataBylineCreator', () => {
      const item = approvalItem(byline, statusDataBylineCreator)
      render(<AuthorNames item={item} />)
      expect(screen.getByTitle('Byline John Doe'))
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
  })
})
