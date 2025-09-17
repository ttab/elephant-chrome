import { render, screen } from '@testing-library/react'
import { AuthorNames, authorOutput } from '../src/views/Approvals/AuthorNames'
import type { IDBAuthor } from '../src/datastore/types'
import type { AssignmentInterface } from '@/hooks/index/useAssignments'
import { Block } from '@ttab/elephant-api/newsdoc'

const statusData = '{\n  "uuid": "3ee39e5d-3e52-4cb1-a321-8e646ddcea55",\n  "version": "12",\n  "modified": "2025-09-15T13:42:38Z",\n  "heads": {\n    "approved": {\n      "id": "1",\n      "version": "12",\n      "creator": "core://user/002",\n      "created": "2025-09-15T13:42:38Z",\n      "meta": {},\n      "metaDocVersion": "11"\n    },\n    "done": {\n      "id": "1",\n      "version": "5",\n      "creator": "core://user/001",\n      "created": "2025-09-15T11:07:32Z",\n      "meta": {},\n      "metaDocVersion": "4"\n    }\n  },\n  "workflowState": "approved",\n  "workflowCheckpoint": ""\n}'

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
    const author: IDBAuthor = { id: '123', name: 'Alice Johnson', firstName: 'Alice', lastName: 'Johnson', initials: '', email: 'aj@example.com', sub: 'core://user/001' }
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
    const a = assignment(undefined, statusData)
    render(
      <AuthorNames assignment={a} />
    )
    expect(screen.getByText(/AJ/)).toBeInTheDocument()
  })

  it('renders byline and lastStatusUpdateAuthor', () => {
    const byline = Block.create({
      uuid: '8a18cc16-7323-4444-8a30-1770222575f8',
      type: 'core/author',
      title: 'John Doe',
      rel: 'author'
    })

    const a = assignment(byline, statusData)
    render(
      <AuthorNames assignment={a} />
    )
    expect(screen.getByText(/John Doe/)).toBeInTheDocument()
    expect(screen.getByText(/BL/)).toBeInTheDocument()
  })

  it('renders from doneStatus if no byline and lastStatusUpdateAuthor', () => {
    const a = assignment(undefined, statusData)

    render(
      <AuthorNames assignment={a} />
    )
    expect(screen.getByText(/BL/)).toBeInTheDocument()
    expect(screen.getByText(/AJ/)).toBeInTheDocument()
  })

  it('renders initials for assignees with afterDraftAuthor and lastStatusUpdateAuthor', () => {
    const a = assignment(undefined, statusData)
    render(
      <AuthorNames assignment={a} />
    )
    expect(screen.getByText(/AJ/)).toBeInTheDocument()
    expect(screen.getByText(/BL/)).toBeInTheDocument()
  })
})
