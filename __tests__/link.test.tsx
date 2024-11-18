import { NavigationProvider } from '@/navigation/NavigationProvider'
import userEvent from '@testing-library/user-event'

import { render, screen } from '../setupTests'
import { Link } from '@/components'

describe('Link', () => {
  it('should render Link component', async () => {
    render(
      <NavigationProvider>
        <Link to='Editor' props={{ id: 'abc123' }}>
          Planning Overview
        </Link>
      </NavigationProvider>
    )
    expect(screen.getByText('Planning Overview')).toBeInTheDocument()

    await userEvent.click(screen.getByText('Planning Overview'))
    setTimeout(() => {
      expect(history.state.contentState[0].props.id).toBe('abc123')
      expect(history.state.contentState[0].name).toBe('Editor')
      expect(history.state.contentState[0].path).toBe('/elephant/editor?id=abc123')
    })
  })
})
