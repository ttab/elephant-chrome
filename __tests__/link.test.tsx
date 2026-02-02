import userEvent from '@testing-library/user-event'

import { render, screen } from '../setupTests'
import { Link } from '@/components'
import type { HistoryState } from '@/navigation/hooks/useHistory'
import { useNavigation, useView } from '@/hooks/index'
import { initializeNavigationState } from '@/navigation/lib'
import type { NavigationAction, ViewProviderState } from '@/types/index'
import type { Dispatch } from 'react'

vi.mock('@/navigation/hooks/useNavigation', () => ({
  useNavigation: vi.fn()
}))

vi.mock('@/hooks/useView', () => ({
  useView: vi.fn()
}))

const mockState = initializeNavigationState()

history.pushState({
  viewId: 'eddbfe39-57d4-4b32-b9a1-a555e39139ea',
  contentState: [
    {
      viewId: 'eddbfe39-57d4-4b32-b9a1-a555e39139ea',
      name: 'Plannings',
      props: {},
      path: '/'
    }
  ]
}, '', '/')

const mockDispatch = vi.fn() as Dispatch<NavigationAction>


vi.mocked(useNavigation).mockReturnValue({
  state: mockState,
  dispatch: mockDispatch
})

vi.mocked(useView).mockReturnValue({
  viewId: 'eddbfe39-57d4-4b32-b9a1-a555e39139ea'
} as ViewProviderState)

describe('Link', () => {
  it('should render Link component', async () => {
    render(
      <Link to='Editor' props={{ id: 'abc123' }}>
        Planning Overview
      </Link>
    )
    expect(screen.getByText('Planning Overview')).toBeInTheDocument()

    await userEvent.click(screen.getByText('Planning Overview'))
    const historyState = history.state as HistoryState

    expect(historyState?.contentState[1].props?.id).toBe('abc123')
    expect(historyState?.contentState[1].name).toBe('Editor')
    expect(historyState?.contentState[1].path).toContain(`/editor?id=abc123`)
  })
})
