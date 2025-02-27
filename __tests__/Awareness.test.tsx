import { createRef } from 'react'
import { screen, render } from '@testing-library/react'
import { Awareness } from '@/components/Awareness'
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
  it('renders children with className "relative" when path is given', () => {
    render(
      <Awareness name='test' path='root.fake.path'>
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
      <Awareness name='test'>
        <div data-testid='child'>Child Component</div>
      </Awareness>
    )

    const childElement = screen.getByTestId('child')
    expect(childElement).toBeInTheDocument()

    const wrapperDiv = childElement.parentElement
    expect(wrapperDiv).not.toHaveClass('relative')
  })

  it('forwards setIsFocused function through ref', () => {
    const ref = createRef<() => void>()

    render(
      <Awareness name='test' ref={ref}>
        <div data-testid='child'>Child Component</div>
      </Awareness>
    );

    // Access the ref and trigger the function returned by useImperativeHandle
    (ref.current as () => void)()

    // Check if setIsFocused function is called
    expect(setIsFocusedMock).toHaveBeenCalled()
  })
})
