import { createRef } from 'react'
import { screen, render } from '@testing-library/react'
import { Awareness } from '@/components/Awareness'
import { vi } from 'vitest'
import * as hooks from '@/modules/yjs/hooks'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'

const setIsFocusedMock = vi.fn()

vi.spyOn(hooks, 'useYAwareness').mockReturnValue([
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
  it('renders children with className "relative" when path is given', () => {
    render(
      <Awareness ydoc={{ id: '123' } as YDocument<Y.Map<unknown>>} path='root.fake.path'>
        <div data-testid='child'>Child Component</div>
      </Awareness>
    )

    const childElement = screen.getByTestId('child')
    expect(childElement).toBeInTheDocument()

    const wrapperDiv = childElement.parentElement
    expect(wrapperDiv).toHaveClass('relative')
  })

  it('renders children without className "relative" when path is not given', () => {
    render(
      <Awareness ydoc={{ id: '123' } as YDocument<Y.Map<unknown>>}>
        <div data-testid='child'>Child Component</div>
      </Awareness>
    )

    const childElement = screen.getByTestId('child')
    expect(childElement).toBeInTheDocument()

    const wrapperDiv = childElement.parentElement
    expect(wrapperDiv).not.toHaveClass('relative')
  })

  it('forwards setIsFocused function through ref', () => {
    const ref = createRef<(focused: boolean, path?: string) => void>()

    render(
      <Awareness ydoc={{ id: '123' } as YDocument<Y.Map<unknown>>} path='test' ref={ref}>
        <div data-testid='child'>Child Component</div>
      </Awareness>
    )

    // Call the function with proper arguments
    ref.current?.(true, 'test-path')

    // Check if setIsFocused function was called with correct arguments
    expect(setIsFocusedMock).toHaveBeenCalledWith(true, 'test-path')
  })
})
