import { render, screen } from '@testing-library/react'
import { AuthorNames, authorOutput } from '../src/views/Approvals/AuthorNames'
import type { IDBAuthor, StatusMeta } from '../src/datastore/types'

describe('authorOutput', () => {
  it('returns initials if present', () => {
    const author: IDBAuthor = { id: '123', name: 'Alice Johnson', firstName: 'Alice', lastName: 'Johnson', initials: 'AJ', email: 'aj@example.com', sub: 'core://user/001' }
    expect(authorOutput(author)).toBe('AJ')
  })

  it('returns first letters of first and last name if initials missing', () => {
    const author: IDBAuthor = { id: '123', name: 'Alice Johnson', firstName: 'Alice', lastName: 'Johnson', initials: '', email: 'aj@example.com', sub: 'core://user/001' }
    expect(authorOutput(author)).toBe('AJ')
  })
})

describe('AuthorNames', () => {
  const authors: IDBAuthor[] = [
    { id: '123', name: 'Alice Johnson', firstName: 'Alice', lastName: 'Johnson', initials: 'AJ', email: 'aj@example.com', sub: 'core://user/001' },
    { id: '234', name: 'Bob Lee', firstName: 'Bob', lastName: 'Lee', email: 'bl@example.com', sub: 'core://user/002' },
    { id: '345', name: 'Christine King', firstName: 'Christine', lastName: 'King', initials: 'CK', email: 'ck@example.com', sub: 'core://user/003' }
  ]

  const doneStatus: StatusMeta = {
    id: 1n,
    version: 5n,
    creator: 'core://user/001',
    created: '2025-09-15T12:30:59Z',
    meta: {},
    metaDocVersion: 4n }

  it('renders byline if present', () => {
    render(
      <AuthorNames
        byline='John Doe'
        authors={authors}
        doneStatus={undefined}
      />
    )
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('renders byline if present and lastStatusUpdateAuthor', () => {
    render(
      <AuthorNames
        byline='John Doe'
        authors={authors}
        doneStatus={undefined}
        lastStatusUpdateAuthor={authors[1]}
      />
    )
    expect(screen.getByText(/John Doe, BL/)).toBeInTheDocument()
  })

  it('renders DoneMarkedBy if no byline and doneStatus exists', () => {
    render(
      <AuthorNames
        byline={undefined}
        authors={authors}
        doneStatus={doneStatus}
      />
    )
    expect(screen.getByText(/AJ/)).toBeInTheDocument()
  })

  it('renders initials for assignees with afterDraftAuthor and lastStatusUpdateAuthor', () => {
    render(
      <AuthorNames
        byline={undefined}
        authors={authors}
        doneStatus={doneStatus}
        afterDraftAuthor={authors[0]}
        lastStatusUpdateAuthor={authors[1]}
      />
    )
    expect(screen.getByText(/AJ, BL/)).toBeInTheDocument()
  })
})
