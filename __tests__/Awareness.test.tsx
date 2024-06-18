import { createRef } from 'react'
import { screen, render } from '@testing-library/react'
import { Awareness } from '../src/components/Awareness'
import { vi } from 'vitest'
import * as hooks from '@/hooks'

const setIsFocusedMock = vi.fn()
// Mock the useAwareness hook

vi.spyOn(hooks, 'useAwareness').mockReturnValue([[{ clientId: 1, data: { name: 'Test', initials: 'T', color: 'a' }, focus: { key: '', color: 'rgb(248 113 113)' } }], setIsFocusedMock])

describe('Awareness component', () => {
  it('renders children with proper className when visual is true', () => {
    render(
      <Awareness name="test" visual={true}>
        <div data-testid="child">Child Component</div>
      </Awareness>
    )

    const childElement = screen.getByTestId('child')
    expect(childElement).toBeInTheDocument()

    const wrapperDiv = childElement.parentElement
    expect(wrapperDiv).toHaveClass('rounded')
    expect(wrapperDiv).toHaveClass('ring')
    expect(wrapperDiv).toHaveClass('ring-red-400')
  })

  it('renders children without ring className when visual is false', () => {
    render(
      <Awareness name="test" visual={false}>
        <div data-testid="child">Child Component</div>
      </Awareness>
    )

    const childElement = screen.getByTestId('child')
    expect(childElement).toBeInTheDocument()

    const wrapperDiv = childElement.parentElement
    expect(wrapperDiv).toHaveClass('rounded')
    expect(wrapperDiv).not.toHaveClass('ring')
  })

  it('forwards setIsFocused function through ref', () => {
    const ref = createRef<() => void>()

    render(
      <Awareness name="test" visual={true} ref={ref}>
        <div data-testid="child">Child Component</div>
      </Awareness>
    );

    // Access the ref and trigger the function returned by useImperativeHandle
    (ref.current as () => void)()

    // Check if setIsFocused function is called
    expect(setIsFocusedMock).toHaveBeenCalled()
  })
})
