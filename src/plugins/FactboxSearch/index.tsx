import { TextSearchIcon } from '@ttab/elephant-ui/icons'
import { handleLink } from '@/components/Link/lib/handleLink'
import { useNavigation, useQuery, useView } from '@/hooks'
import { type ActionHandlerI } from '../types'
import { type Plugin } from '@ttab/textbit'

function handler({ dispatch, viewRegistry, origin, id }: ActionHandlerI): boolean {
  handleLink({
    event: undefined,
    dispatch,
    viewItem: viewRegistry?.get('FactboxSearch'),
    viewRegistry,
    viewId: crypto.randomUUID(),
    props: { id },
    origin
  })
  return true
}

export const FactboxPlugin: Plugin.InitFunction = () => {
  const { state, dispatch } = useNavigation()
  const { viewId: origin } = useView()
  const viewRegistry = state.viewRegistry
  const query = useQuery()
  const { id } = query

  return {
    class: 'block',
    name: 'core/factbox/search',
    componentEntry: {
      class: 'block',
      component: () => null
    },
    actions: [
      {
        name: 'core/factbox/search',
        title: 'Factbox search',
        tool: () => <TextSearchIcon style={{ width: '1em', height: '1em' }} />,
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
