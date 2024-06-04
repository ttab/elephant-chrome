import { type NavigationAction, type ViewRegistry } from '../types'
import { type Dispatch } from 'react'

export interface ActionHandlerI {
  dispatch: Dispatch<NavigationAction>
  viewRegistry: ViewRegistry
  origin: string
}
