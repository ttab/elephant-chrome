import { TextSearchIcon } from '@ttab/elephant-ui/icons'
import { useLink } from '@/hooks'
import { type Plugin } from '@ttab/textbit'

export const FactboxPlugin: Plugin.InitFunction = () => {
  const openFactboxes = useLink('Factboxes')

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
        title: 'Faktarutor',
        tool: () => <TextSearchIcon style={{ width: '1em', height: '1em' }} />,
        handler: () => {
          openFactboxes(undefined, {})
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
