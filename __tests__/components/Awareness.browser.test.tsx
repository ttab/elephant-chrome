import { createRef } from 'react'
import { render } from 'vitest-browser-react'
import { Awareness } from '@/components/Awareness'
import { useYAwareness } from '@/modules/yjs/hooks/useYAwareness'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'

vi.mock('@/modules/yjs/hooks/useYAwareness', () => ({
  useYAwareness: vi.fn()
}))

const setIsFocusedMock = vi.fn()

vi.mocked(useYAwareness).mockReturnValue([
  [
    {
      clientId: 1870901647,
      data: {
        name: 'Testy Testerson',
        initials: 'TT',
        color: 'rgb(6 182 212)'
      },
      focus: {
        key: 'PlanSection'
      }
    }
  ], setIsFocusedMock])

describe('Awareness component', () => {
  it('renders children with className "relative" when path is given',
    async () => {
      const screen = await render(
        <Awareness
          ydoc={{ id: '123' } as YDocument<Y.Map<unknown>>}
          path='root.fake.path'
        >
          <div>Child Component</div>
        </Awareness>
      )

      await expect.element(screen.getByText('Child Component')).toBeVisible()

      const child = screen.getByText('Child Component').element()
      expect(
        child.parentElement?.classList.contains('relative')
      ).toBe(true)
    })

  it('renders children without className "relative" when not given',
    async () => {
      const screen = await render(
        <Awareness
          ydoc={{ id: '123' } as YDocument<Y.Map<unknown>>}
        >
          <div>Child Component</div>
        </Awareness>
      )

      await expect.element(screen.getByText('Child Component')).toBeVisible()

      const child = screen.getByText('Child Component').element()
      expect(
        child.parentElement?.classList.contains('relative')
      ).toBe(false)
    })

  it('forwards setIsFocused function through ref', async () => {
    const ref = createRef<(focused: boolean, path?: string) => void>()

    await render(
      <Awareness
        ydoc={{ id: '123' } as YDocument<Y.Map<unknown>>}
        path='test'
        ref={ref}
      >
        <div data-testid='child'>Child Component</div>
      </Awareness>
    )

    ref.current?.(true, 'test-path')
    expect(setIsFocusedMock).toHaveBeenCalledWith(true, 'test-path')
  })
})
