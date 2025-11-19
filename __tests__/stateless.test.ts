import { createStateless, StatelessType, parseStateless } from '../shared/stateless'

describe('stateless', () => {
  it('should create and parse stateless auth message', () => {
    const statelessMsg = createStateless(StatelessType.AUTH, { accessToken: 'secretToken' })
    expect(statelessMsg).toEqual(`${StatelessType.AUTH}@${JSON.stringify({ accessToken: 'secretToken' })}`)

    const parsed = parseStateless(statelessMsg)
    expect(parsed).toEqual({ type: StatelessType.AUTH, message: { accessToken: 'secretToken' } })
  })

  it('should create and parse a stateless message', () => {
    const statelessMsg = createStateless(StatelessType.MESSAGE, 'test message')
    expect(statelessMsg).toEqual(`${StatelessType.MESSAGE}@${JSON.stringify('test message')}`)

    const parsed = parseStateless(statelessMsg)
    expect(parsed).toEqual({ type: StatelessType.MESSAGE, message: 'test message' })
  })

  it('should create and parse a stateless context message', () => {
    const statelessMsg = createStateless(StatelessType.CONTEXT, { invisible: true, id: '123' })
    expect(statelessMsg).toEqual(`${StatelessType.CONTEXT}@${JSON.stringify({ invisible: true, id: '123' })}`)

    const parsed = parseStateless(statelessMsg)
    expect(parsed).toEqual({ type: StatelessType.CONTEXT, message: { invisible: true, id: '123' } })
  })

  it('should throw an error for invalid stateless type', () => {
    // @ts-expect-error test invalid state
    expect(() => createStateless('invalid', 'test message'))
      .toThrow('Invalid stateless type: invalid')

    expect(() => parseStateless('invalid@test message'))
      .toThrow('Invalid stateless type: invalid')
  })
})
