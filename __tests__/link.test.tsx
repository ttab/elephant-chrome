import { NavigationProvider } from '@/navigation/NavigationProvider'
import userEvent from '@testing-library/user-event'

import { render, screen } from '../setupTests'
import { Link } from '@/components'
import type { HistoryState } from '@/navigation/hooks/useHistory'

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
    const historyState = history.state as HistoryState

    expect(historyState?.contentState[1].props?.id).toBe('abc123')
    expect(historyState?.contentState[1].name).toBe('Editor')
    expect(historyState?.contentState[1].path).toContain(`/editor?id=abc123`)
  })
})
