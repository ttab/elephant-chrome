import { SessionProvider } from '@/contexts'
import { NavigationProvider } from '@/navigation/components'
import userEvent from '@testing-library/user-event'

import { render, screen } from '../setupTests'
import { Link } from '@/components'

describe('Link', () => {
  it('should render Link component', async () => {
    render(
      <SessionProvider endpoint={new URL('/user', 'http://localhost')}>
        <NavigationProvider>
          <Link to='Editor' props={{ documentId: 'abc123' }}>
            Planning Overview
          </Link>
        </NavigationProvider>
      </SessionProvider>
    )
    expect(screen.getByText('Planning Overview')).toBeInTheDocument()

    await userEvent.click(screen.getByText('Planning Overview'))
    setTimeout(() => {
      expect(history.state.contentState[0].props.documentId).toBe('abc123')
      expect(history.state.itemName).toBe('Editor')
      expect(history.state.contentState[0].path).toBe('/editor?documentId=abc123')
    })
  })
})
