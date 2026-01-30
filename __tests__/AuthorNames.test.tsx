import { render, screen } from '@testing-library/react'
import { AuthorNames, authorOutput } from '../src/views/Approvals/AuthorNames'
import type { IDBAuthor } from '../src/datastore/types'
import type { AssignmentInterface } from '@/hooks/index/useAssignments'
import { Block } from '@ttab/elephant-api/newsdoc'


vi.mock('@/hooks/useAuthors', () => ({
  useAuthors: () => [
    { id: '123', name: 'Alice Johnson', firstName: 'Alice', lastName: 'Johnson', initials: 'AAJ', email: 'aj@example.com', sub: 'core://user/0001' },
    { id: '234', name: 'Bob Lee', firstName: 'Bob', lastName: 'Lee', email: 'bl@example.com', sub: 'core://user/0002' },
    { id: '345', name: 'Christine King', firstName: 'Christine', lastName: 'King', initials: 'CK', email: 'ck@example.com', sub: 'core://user/0003' }
  ]
}))

const statusData = {
  uuid: '3ee39e5d-3e52-4cb1-a321-8e646ddcea55',
  version: '12',
  modified: '2025-09-15T13:42:38Z',
  heads: {
    approved: {
      id: '1',
      version: '12',
      creator: 'core://user/0002',
      created: '2025-09-15T13:42:38Z',
      meta: {},
      metaDocVersion: '11'
    },
    done: {
      id: '1',
      version: '5',
      creator: 'core://user/0001',
      created: '2025-09-15T11:07:32Z',
      meta: {},
      metaDocVersion: '4'
    }
  },
  workflowState: 'approved',
  workflowCheckpoint: ''
}

const statusDataDone = {
  uuid: 'd3ce21b1-ea1d-4787-980b-e4c970f0b9d1',
  version: '6',
  modified: '2025-10-09T07:58:06Z',
  heads: {
    done: {
      id: '2',
      version: '6',
      creator: 'core://user/0001',
      created: '2025-10-09T07:58:06Z',
      meta: {},
      metaDocVersion: '3'
    },
    draft: {
      id: '1',
      version: '5',
      creator: 'core://user/0001',
      created: '2025-10-09T07:58:02Z',
      meta: {},
      metaDocVersion: '3'
    }
  },
  workflowState: 'done',
  workflowCheckpoint: '',
  creatorUri: 'core://user/0001',
  updaterUri: 'core://user/0001'
}
const statusDataCreator = {
  uuid: 'a96727a0-ba89-40cb-a5c0-90aff0ef7ea1',
  version: '1',
  modified: '2025-10-09T07:53:52Z',
  heads: {},
  workflowState: 'draft',
  workflowCheckpoint: '',
  creatorUri: 'core://user/0002',
  updaterUri: 'core://user/0002'
}

const statusDataStatusAfterDraft = {
  uuid: '28d98881-6880-4813-b6d1-7e4be32a2909',
  version: '5',
  modified: '2025-10-09T08:22:31Z',
  heads: {
    approved: {
      id: '2',
      version: '5',
      creator: 'core://user/0002',
      created: '2025-10-09T08:22:31Z',
      meta: {},
      metaDocVersion: '0'
    },
    draft: {
      id: '1',
      version: '4',
      creator: 'core://user/0001',
      created: '2025-10-09T08:22:26Z',
      meta: {},
      metaDocVersion: '0'
    }
  },
  workflowState: 'approved',
  workflowCheckpoint: '',
  creatorUri: 'core://user/0001',
  updaterUri: 'core://user/0001'
}

const statusDataCreatorApproved = {
  uuid: '28d98881-6880-4813-b6d1-7e4be32a2909',
  version: '5',
  modified: '2025-10-09T08:22:31Z',
  heads: {
    approved: {
      id: '3',
      version: '5',
      creator: 'core://user/0002',
      created: '2025-10-09T08:22:31Z',
      meta: {},
      metaDocVersion: '0'
    },
    done: {
      id: '2',
      version: '5',
      creator: 'core://user/0001',
      created: '2025-10-09T08:22:31Z',
      meta: {},
      metaDocVersion: '0'
    },
    draft: {
      id: '1',
      version: '4',
      creator: 'core://user/0001',
      created: '2025-10-09T08:22:26Z',
      meta: {},
      metaDocVersion: '0'
    }
  },
  workflowState: 'approved',
  workflowCheckpoint: '',
  creatorUri: 'core://user/0001',
  updaterUri: 'core://user/0001'
}
const statusDataBylineApproved = {
  uuid: '1184232f-68e8-4a85-b5dd-04a9257a7b1f',
  version: '3',
  modified: '2025-10-09T08:21:19Z',
  heads: {
    approved: {
      id: '1',
      version: '3',
      creator: 'core://user/0001',
      created: '2025-10-09T08:21:19Z',
      meta: {},
      metaDocVersion: '0'
    }
  },
  workflowState: 'approved',
  workflowCheckpoint: '',
  creatorUri: 'core://user/0001',
  updaterUri: 'core://user/0001'
}
const statusDataBylineDone = {
  uuid: 'b75ef179-963f-49f0-89df-c77af499a78a',
  version: '6',
  modified: '2025-10-09T08:17:25Z',
  heads: {
    done: {
      id: '2',
      version: '6',
      creator: 'core://user/0001',
      created: '2025-10-09T08:17:25Z',
      meta: {},
      metaDocVersion: '2'
    },
    draft: {
      id: '1',
      version: '5',
      creator: 'core://user/0001',
      created: '2025-10-09T08:17:20Z',
      meta: {},
      metaDocVersion: '2'
    }
  },
  workflowState: 'done',
  workflowCheckpoint: '',
  creatorUri: 'core://user/0001',
  updaterUri: 'core://user/0001'
}

const statusDataBylineCreator = {
  uuid: 'aa62431c-ea80-4287-a570-9c0b1e2d94ae',
  version: '3',
  modified: '2025-10-09T07:59:03Z',
  heads: {},
  workflowState: 'draft',
  workflowCheckpoint: '',
  creatorUri: 'core://user/0001',
  updaterUri: 'core://user/0001'
}


const byline = Block.create({
  uuid: '8a18cc16-7323-4444-8a30-1770222575f8',
  type: 'core/author',
  title: 'John Doe',
  rel: 'author'
})

const assignment = (byline?: Block, statusData?: string) => ({
  links: [
    {
      uuid: '8a18cc16-7323-4444-8a30-1770222575f8',
      type: 'core/author',
      title: 'John Doe',
      rel: 'assignee',
      role: 'primary'
    }
  ],
  _deliverableStatus: 'approved',
  ...(statusData ? { _statusData: statusData } : {}),
  _deliverableDocument: {
    links: [
      {
        uri: 'tt://content-source/tt',
        type: 'core/content-source',
        title: 'TT',
        rel: 'source'
      },
      ...(byline ? [byline] : [])
    ]
  }
}) as unknown as AssignmentInterface

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
    const a = assignment(byline)

    render(
      <AuthorNames assignment={a} />
    )
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('renders from doneStatus if no byline', () => {
    const a = assignment(undefined, JSON.stringify(statusData))
    render(
      <AuthorNames assignment={a} />
    )
    expect(screen.getByText(/AJ/)).toBeInTheDocument()
  })

  it('renders byline and lastStatusUpdateAuthor', () => {
    const a = assignment(byline, JSON.stringify(statusData))
    render(
      <AuthorNames assignment={a} />
    )
    expect(screen.getByText(/John Doe/)).toBeInTheDocument()
    expect(screen.getByText(/BL/)).toBeInTheDocument()
  })

  it('renders from doneStatus if no byline and lastStatusUpdateAuthor', () => {
    const a = assignment(undefined, JSON.stringify(statusData))

    render(
      <AuthorNames assignment={a} />
    )
    expect(screen.getByText(/BL/)).toBeInTheDocument()
    expect(screen.getByText(/AJ/)).toBeInTheDocument()
  })

  it('renders initials for assignees with afterDraftAuthor and lastStatusUpdateAuthor', () => {
    const a = assignment(undefined, JSON.stringify(statusData))
    render(
      <AuthorNames assignment={a} />
    )
    expect(screen.getByText(/AJ/)).toBeInTheDocument()
    expect(screen.getByText(/BL/)).toBeInTheDocument()
  })
})

describe('AuthorNames with various statusData assert tooltip', () => {
  it('renders correctly with statusDataDone', () => {
    const a = assignment(undefined, JSON.stringify(statusDataDone))
    render(<AuthorNames assignment={a} />)

    // Should only show whoever sat status done
    expect(screen.getByTitle('Klar av Alice Johnson'))
  })

  it('renders correctly with statusDataCreator', () => {
    const a = assignment(undefined, JSON.stringify(statusDataCreator))
    render(<AuthorNames assignment={a} />)

    // Should only show document creator
    expect(screen.getByTitle('Skapad av Bob Lee'))
  })

  it('renders correctly with statusDataStatusAfterDraft', () => {
    const a = assignment(undefined, JSON.stringify(statusDataStatusAfterDraft))
    render(<AuthorNames assignment={a} />)

    // Should show who set status after draft and last status (in this case the same status)
    expect(screen.getByTitle('Av Bob Lee, Godkänd av Bob Lee')).toBeInTheDocument()
  })

  it('renders correctly with statusDataCreatorApproved', () => {
    const a = assignment(undefined, JSON.stringify(statusDataCreatorApproved))
    render(<AuthorNames assignment={a} />)

    // Should show who set status
    expect(screen.getByTitle('Klar av Alice Johnson, Godkänd av Bob Lee')).toBeInTheDocument()
  })

  describe('handles byline', () => {
    it('renders correctly with statusDataBylineCreator', () => {
      const a = assignment(byline, JSON.stringify(statusDataBylineCreator))
      render(<AuthorNames assignment={a} />)

      // Should only show byline, no status
      expect(screen.getByTitle('Byline John Doe')).toBeInTheDocument()
    })

    it('renders correctly with statusDataBylineApproved', () => {
      const a = assignment(byline, JSON.stringify(statusDataBylineApproved))
      render(<AuthorNames assignment={a} />)

      // Should show byline and approved by
      expect(screen.getByTitle('Byline John Doe, Godkänd av Alice Johnson')).toBeInTheDocument()
    })

    it('renders correctly with statusDataBylineDone', () => {
      const a = assignment(byline, JSON.stringify(statusDataBylineDone))
      render(<AuthorNames assignment={a} />)
      expect(screen.getByTitle('Byline John Doe')).toBeInTheDocument()
    })

    it('renders correctly with statusDataBylineCreator', () => {
      const a = assignment(byline, JSON.stringify(statusDataBylineCreator))
      render(<AuthorNames assignment={a} />)
      expect(screen.getByTitle('Byline John Doe'))
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
  })
})
