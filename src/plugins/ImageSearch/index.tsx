import { ScanSearch } from '@ttab/elephant-ui/icons'
import { useLink } from '@/hooks'
import { type Plugin } from '@ttab/textbit'

export const ImageSearchPlugin: Plugin.InitFunction = () => {
  const openImageSearch = useLink('ImageSearch')

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
        title: 'Bilder',
        tool: () => <ScanSearch style={{ width: '1em', height: '1em' }} />,
        handler: () => {
          openImageSearch(undefined, {})
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
