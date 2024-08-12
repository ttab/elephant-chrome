import { ScanSearch } from '@ttab/elephant-ui/icons'
import { handleLink } from '@/components/Link/lib/handleLink'
import { useNavigation, useQuery, useView } from '@/hooks'
import { type ActionHandlerI } from '../types'
import { type Plugin } from '@ttab/textbit'

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

export const ImageSearchPlugin: Plugin.InitFunction = () => {
  const { state, dispatch } = useNavigation()
  const { viewId: origin } = useView()
  const viewRegistry = state.viewRegistry
  const query = useQuery()
  const { id } = query

  return {
    class: 'block',
    name: 'tt/visual/search',
    componentEntry: {
      class: 'block',
      // TODO: Do we need this, or can we make component optional in the types
      component: () => null
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
            true,
            true,
            false
          ]
        }
      }
    ]
  }
}
