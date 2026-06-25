import { render } from '@testing-library/react'
import { Form } from '@/components/Form'
import type { FormProps } from '@/components/Form/Root'

// A probe that records the form props injected into it by the propagation chain.
let received: FormProps = {}

const Probe = (props: FormProps): null => {
  received = props
  return null
}

describe('Form.Columns', () => {
  beforeEach(() => {
    received = {}
  })

  it('renders both the left column and the right-column children', () => {
    const { getByText } = render(
      <Form.Root asDialog>
        <Form.Content>
          <Form.Columns left={<span>left-content</span>}>
            <span>right-content</span>
          </Form.Columns>
        </Form.Content>
      </Form.Root>
    )

    expect(getByText('left-content')).toBeInTheDocument()
    expect(getByText('right-content')).toBeInTheDocument()
  })

  // This is the regression guard: before the fix the planning fields lived inside
  // plain wrapper <div>s, which swallowed onValidation/validateStateRef so Section
  // and Newsvalue never registered as mandatory. Form.Columns must forward them.
  it('forwards validation props down to fields nested in the right column', () => {
    render(
      <Form.Root asDialog>
        <Form.Content>
          <Form.Columns left={<span>desc</span>}>
            <Form.Group>
              <Probe />
            </Form.Group>
          </Form.Columns>
        </Form.Content>
      </Form.Root>
    )

    expect(typeof received.onValidation).toBe('function')
    expect(received.validateStateRef).toBeDefined()
  })
})
