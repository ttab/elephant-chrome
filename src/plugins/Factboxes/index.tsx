import type { LinkHandlerFunction } from '@/hooks/useLink'
import { TextSearchIcon } from '@ttab/elephant-ui/icons'
import type { TBPluginInitFunction } from '@ttab/textbit'
import i18next from 'i18next'

type FactboxPluginOptions = {
  openFactboxes: LinkHandlerFunction
}

export const FactboxPlugin: TBPluginInitFunction<FactboxPluginOptions> = (options) => {
  const openFactboxes = options?.openFactboxes

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
        title: i18next.t('editor:contentMenu.factboxes'),
        tool: () => <TextSearchIcon style={{ width: '1em', height: '1em' }} />,
        handler: () => {
          openFactboxes?.(undefined, {})
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
