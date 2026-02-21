import { getAuthorBySub } from '@/lib/getAuthorBySub'
import type { IDBAuthor } from 'src/datastore/types'

const mockAuthors: IDBAuthor[] = [
  {
    id: 'author-0',
    name: 'Author Zero',
    firstName: 'Author',
    lastName: 'Zero',
    initials: 'AZ',
    email: 'author.zero@example.com',
    sub: 'core://user/sub/12'
  },
  {
    id: 'author-1',
    name: 'Author One',
    firstName: 'Author',
    lastName: 'One',
    initials: 'AO',
    email: 'author.one@example.com',
    sub: 'core://user/sub/1234'
  },
  {
    id: 'author-2',
    name: 'Author Two',
    firstName: 'Author',
    lastName: 'Two',
    initials: 'AT',
    email: 'author.two@example.com',
    sub: 'core://user/sub/cf8eb669-0c0f-432d-8fdf-b479ac2082a1'
  }
]

describe('getAuthorBySub', () => {
  it('returns the matching author when the sub contains a user/ prefix', () => {
    const result = getAuthorBySub(mockAuthors, 'core://user/1234')

    expect(result).toEqual(mockAuthors[1])
  })

  it('returns the matching author when the sub contains a user/sub/ prefix', () => {
    const result = getAuthorBySub(mockAuthors, 'core://user/sub/1234')

    expect(result).toEqual(mockAuthors[1])
  })

  it('returns the matching author when the sub contains a UUID', () => {
    const result = getAuthorBySub(mockAuthors, 'core://user/cf8eb669-0c0f-432d-8fdf-b479ac2082a1')

    expect(result).toEqual(mockAuthors[2])
  })


  it('returns undefined when the sub does not match the expected pattern', () => {
    const result = getAuthorBySub(mockAuthors, '1234')

    expect(result).toBeUndefined()
  })

  it('returns undefined when the sub is not provided as a string', () => {
    const result = getAuthorBySub(mockAuthors, undefined)

    expect(result).toBeUndefined()
  })
})
