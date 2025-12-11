import { ViewProvider } from './ViewProvider'
import { ViewContainer } from './ViewContainer'
import type { JSX } from 'react'

export const ViewWrapper = ({ children, viewId, name, colSpan: wantedColSpan }: {
  children: JSX.Element
  viewId: string
  name: string
  colSpan: number
}): JSX.Element => {
  return (
    <ViewProvider viewId={viewId} name={name}>
      <ViewContainer colSpan={wantedColSpan}>
        {children}
      </ViewContainer>
    </ViewProvider>
  )
}
