import { authorOutput } from '../src/views/Approvals/AuthorNames'
import type { IDBAuthor } from '../src/datastore/types'


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
