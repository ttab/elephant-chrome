import { createRef } from 'react'
import { screen, render } from '@testing-library/react'
import { Awareness } from '../src/components/Awareness'
import { vi } from 'vitest'
import * as hooks from '@/hooks'

const setIsFocusedMock = vi.fn()

vi.spyOn(hooks, 'useAwareness').mockReturnValue([
  [
    {
      clientId: 1870901647,
      data: {
        name: 'Testy Testerson',
        initials: 'TT',
        color: 'rgb(6 182 212)'
      },
      focus: {
        key: 'PlanSection',
        color: 'rgb(6 182 212)'
      }
    }
  ], setIsFocusedMock])

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
    expect(wrapperDiv).toHaveClass('ring-cyan-400')
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
