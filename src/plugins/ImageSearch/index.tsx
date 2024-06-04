import { ScanSearch } from '@ttab/elephant-ui/icons'
import { handleLink } from '@/components/Link/lib/handleLink'
import { useNavigation, useQuery, useView } from '../../hooks'
import { type ActionHandlerI } from '../types'

function handler({ dispatch, viewRegistry, origin, id }: ActionHandlerI): boolean {
  handleLink({
    event: undefined,
    dispatch,
    viewItem: viewRegistry?.get('ImageSearch'),
    viewRegistry,
    viewId: crypto.randomUUID(),
    props: { id },
    origin
  })
  return true
}

export function ImageSearchPlugin(): any {
  const { state, dispatch } = useNavigation()
  const { viewId: origin } = useView()
  const viewRegistry = state.viewRegistry
  const query = useQuery()
  const { id } = query

  return ({
    class: 'block',
    name: 'tt/visual/search',
    componentEntry: {
      class: 'block'
    },
    actions: [
      {
        name: 'tt/visual/search',
        title: 'Image search',
        tool: () => <ScanSearch style={{ width: '1em', height: '1em' }} />,
        handler: () => {
          return handler({ dispatch, viewRegistry, origin, id })
        },
        visibility: () => {
          return [
            true, // Always visible
            true, // Always enabled
            false // Never active
          ]
        }
      }
    ]
  })
}
