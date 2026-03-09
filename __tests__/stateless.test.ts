import { createStateless, StatelessType, parseStateless } from '../shared/stateless'

describe('stateless', () => {
  it('should create and parse a stateless message', () => {
    const statelessMsg = createStateless(StatelessType.MESSAGE, 'test message')
    expect(statelessMsg).toEqual(`${StatelessType.MESSAGE}@${JSON.stringify('test message')}`)

    const parsed = parseStateless(statelessMsg)
    expect(parsed).toEqual({ type: StatelessType.MESSAGE, message: 'test message' })
  })

  it('should create and parse a stateless context message', () => {
    const statelessMsg = createStateless(StatelessType.CONTEXT, { visibility: true, usageId: 'abc', id: '123' })
    expect(statelessMsg).toEqual(`${StatelessType.CONTEXT}@${JSON.stringify({ visibility: true, usageId: 'abc', id: '123' })}`)

    const parsed = parseStateless(statelessMsg)
    expect(parsed).toEqual({ type: StatelessType.CONTEXT, message: { visibility: true, usageId: 'abc', id: '123' } })
  })

  it('should create and parse a stateless error message', () => {
    const raw = new Error('something went wrong')
    const error = { type: 'Error', message: 'something went wrong', stack: 'Error: something went wrong\n  at fn (file.ts:1:1)', raw }
    const statelessMsg = createStateless(StatelessType.ERROR, error)
    expect(statelessMsg).toEqual(`${StatelessType.ERROR}@${JSON.stringify(error)}`)

    const parsed = parseStateless(statelessMsg)
    // Zod strips unknown keys (raw) when parsing against ErrorMessageSchema
    expect(parsed).toEqual({ type: StatelessType.ERROR, message: { type: 'Error', message: 'something went wrong', stack: 'Error: something went wrong\n  at fn (file.ts:1:1)' } })
  })

  it('should throw an error for invalid stateless type', () => {
    // @ts-expect-error test invalid state
    expect(() => createStateless('invalid', 'test message'))
      .toThrow('Invalid stateless type: invalid')

    expect(() => parseStateless('invalid@test message'))
      .toThrow('Invalid stateless type: invalid')
  })
})
