import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { Prompt } from '@/components/Prompt'

const firePointerDownOutside = async () => {
  // Radix attaches its document-level pointerdown listener in a setTimeout(0)
  // inside an effect, so flush a tick before firing the event.
  await waitFor(() => {
    expect(screen.getByText('Confirm')).toBeInTheDocument()
  })
  await new Promise((resolve) => setTimeout(resolve, 0))

  fireEvent.pointerDown(document.body, {
    pointerType: 'mouse',
    button: 0
  })
}

describe('Prompt click-outside', () => {
  it('calls onCancel when no onSecondary is provided', async () => {
    const onPrimary = vi.fn()
    const onCancel = vi.fn()

    render(
      <Prompt
        title='Confirm'
        description='Are you sure?'
        primaryLabel='OK'
        onPrimary={onPrimary}
        onCancel={onCancel}
      />
    )

    await firePointerDownOutside()

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onPrimary).not.toHaveBeenCalled()
  })

  it('calls onSecondary when no onCancel is provided', async () => {
    const onPrimary = vi.fn()
    const onSecondary = vi.fn()

    render(
      <Prompt
        title='Confirm'
        description='Are you sure?'
        primaryLabel='OK'
        onPrimary={onPrimary}
        onSecondary={onSecondary}
      />
    )

    await firePointerDownOutside()

    expect(onSecondary).toHaveBeenCalledTimes(1)
    expect(onPrimary).not.toHaveBeenCalled()
  })
})
