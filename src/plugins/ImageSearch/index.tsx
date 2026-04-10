import type { LinkHandlerFunction } from '@/hooks/useLink'
import { ScanSearchIcon } from '@ttab/elephant-ui/icons'
import type { TBPluginInitFunction } from '@ttab/textbit'

type ImageSearchPluginOptions = {
  openImageSearch: LinkHandlerFunction
}

export const ImageSearchPlugin: TBPluginInitFunction<ImageSearchPluginOptions> = (options) => {
  const openImageSearch = options?.openImageSearch

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
        title: 'Sök bilder',
        tool: () => <ScanSearchIcon style={{ width: '1em', height: '1em' }} />,
        handler: () => {
          openImageSearch?.(undefined, {})
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
