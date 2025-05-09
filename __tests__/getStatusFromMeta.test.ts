import { getStatusFromMeta, type Meta } from '@/lib/getStatusFromMeta'
import { describe, it, expect } from 'vitest'


describe('getStatusInfo', () => {
  it('returns draft when no heads exist', () => {
    const meta = {
      currentVersion: BigInt(0),
      creatorUri: 'core://user/abc',
      updaterUri: 'core://user/abc'
    } as unknown as Partial<Meta> as Meta

    expect(getStatusFromMeta(meta)).toEqual({
      name: 'draft',
      version: BigInt(0),
      creator: 'core://user/abc',
      cause: undefined
    })
  })

  it('returns cancelled when version is -1', () => {
    const meta = {
      currentVersion: BigInt(-1),
      creatorUri: 'core://user/abc',
      updaterUri: 'core://user/abc'
    } as unknown as Partial<Meta> as Meta

    expect(getStatusFromMeta(meta)).toEqual({
      name: 'cancelled',
      version: BigInt(-1),
      creator: 'core://user/abc',
      cause: undefined
    })
  })

  it('returns latest matching status for version', () => {
    const meta = {
      currentVersion: BigInt(3),
      heads: {
        approved: {
          version: BigInt(3),
          creator: 'core://user/abc',
          created: '2025-05-09T10:00:00Z',
          meta: { cause: 'correction' }
        },
        done: {
          version: BigInt(3),
          creator: 'core://user/abc',
          created: '2025-05-09T12:00:00Z',
          meta: { cause: 'fixed' }
        }
      },
      creatorUri: 'core://user/abc',
      updaterUri: 'core://user/abc'
    } as unknown as Partial<Meta> as Meta

    expect(getStatusFromMeta(meta)).toEqual({
      name: 'done',
      version: BigInt(3),
      creator: 'core://user/abc',
      cause: 'fixed'
    })
  })

  it('returns draft if no matching version in heads', () => {
    const meta = {
      currentVersion: BigInt(5),
      heads: {
        done: {
          version: BigInt(3),
          creator: 'core://user/abc',
          created: '2025-05-09T12:00:00Z'
        }
      },
      creatorUri: 'core://user/abc',
      updaterUri: 'core://user/abc'
    } as unknown as Partial<Meta> as Meta

    expect(getStatusFromMeta(meta)).toEqual({
      name: 'done',
      version: BigInt(5),
      creator: 'core://user/abc',
      cause: undefined
    })
  })

  it('returns most recently created status for current version with cause', () => {
    const meta = {
      currentVersion: BigInt(3),
      heads: {
        approved: {
          id: '3',
          version: BigInt(3),
          creator: 'core://user/e475867c-9b16-4a24-9855-54dafe4b1be5',
          created: '2025-05-09T12:44:29Z',
          meta: { cause: 'correction' }
        },
        done: {
          id: '4',
          version: BigInt(3),
          creator: 'core://user/e475867c-9b16-4a24-9855-54dafe4b1be5',
          created: '2025-05-09T15:15:51Z',
          meta: { cause: 'correction' }
        },
        usable: {
          id: '3',
          version: BigInt(3),
          creator: 'core://user/e475867c-9b16-4a24-9855-54dafe4b1be5',
          created: '2025-05-09T09:33:19Z',
          meta: { cause: 'correction' }
        }
      },
      creatorUri: 'core://user/e475867c-9b16-4a24-9855-54dafe4b1be5',
      updaterUri: 'core://user/e475867c-9b16-4a24-9855-54dafe4b1be5'
    }

    expect(getStatusFromMeta(meta)).toEqual({
      name: 'done',
      version: BigInt(3),
      creator: 'core://user/e475867c-9b16-4a24-9855-54dafe4b1be5',
      cause: 'correction'
    })
  })



  it('returns most recently created status for current version with cause', () => {
    const meta = {
      currentVersion: BigInt(14),
      heads: {
        approved: {
          id: '1',
          version: BigInt(3),
          creator: 'core://user/e475867c-9b16-4a24-9855-54dafe4b1be5',
          created: '2025-05-09T09:51:00Z',
          meta: { cause: 'correction' }
        },
        done: {
          id: '11',
          version: BigInt(14),
          creator: 'core://user/e475867c-9b16-4a24-9855-54dafe4b1be5',
          created: '2025-05-09T15:15:51Z',
          meta: { cause: 'correction' }
        },
        usable: {
          id: '2',
          version: BigInt(13),
          creator: 'core://user/e475867c-9b16-4a24-9855-54dafe4b1be5',
          created: '2025-05-09T12:39:07Z',
          meta: { cause: 'correction' }
        }
      },
      creatorUri: 'core://user/e475867c-9b16-4a24-9855-54dafe4b1be5',
      updaterUri: 'core://user/e475867c-9b16-4a24-9855-54dafe4b1be5'
    }

    expect(getStatusFromMeta(meta)).toEqual({
      name: 'done',
      version: BigInt(14),
      creator: 'core://user/e475867c-9b16-4a24-9855-54dafe4b1be5',
      cause: 'correction'
    })
  })
})
