import { NavigationProvider } from '@/navigation'
import userEvent from '@testing-library/user-event'

import { render, screen } from '../setupTests'
import { Link } from '@/components'
import { SessionProvider } from 'next-auth/react'

describe('Link', () => {
  it('should render Link component', async () => {
    render(
      <SessionProvider>
        <NavigationProvider>
          <Link to='Editor' props={{ id: 'abc123' }}>
            Planning Overview
          </Link>
        </NavigationProvider>
      </SessionProvider>
    )
    expect(screen.getByText('Planning Overview')).toBeInTheDocument()

    await userEvent.click(screen.getByText('Planning Overview'))
    setTimeout(() => {
      expect(history.state.contentState[0].props.id).toBe('abc123')
      expect(history.state.viewName).toBe('Editor')
      expect(history.state.contentState[0].path).toBe('/elephant/editor?id=abc123')
    })
  })
})
