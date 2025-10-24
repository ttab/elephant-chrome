import { type Plugin } from '@ttab/textbit'
import { ImageIcon } from '@ttab/elephant-ui/icons'
import {
  Figure,
  FigureImage,
  FigureText,
  FigureByline
} from './components'

import { consume } from './lib/consume'
import { consumes } from './lib/consumes'
import { normalizeImage } from './lib/normalizeImage'
import { actionHandler } from './lib/actionHandler'
import type { Repository } from '@/shared/Repository'

// @ts-expect-error Textbit types uncertainty
export const ImagePlugin: Plugin.InitFunction = (options) => {
  return {
    class: 'block',
    name: 'core/image',
    options,
    consumer: {
      consumes,
      consume: ({ input }) => consume(
        input,
        options?.repository as Repository
      )
    },
    actions: [
      {
        name: 'insert-image',
        title: 'Infoga bild',
        tool: () => <ImageIcon style={{ width: '1em', height: '1em' }} />,
        handler: actionHandler,
        visibility: () => {
          return [
            true, // Always visible
            true, // Always enabled
            false // Never active
          ]
        }
      }
    ],
    componentEntry: {
      class: 'block',
      component: Figure,
      constraints: {
        normalizeNode: normalizeImage
      },
      children: [
        {
          type: 'image',
          class: 'void',
          component: FigureImage
        },
        {
          type: 'text',
          class: 'text',
          component: FigureText,
          constraints: {
            allowBreak: false
          }
        },
        {
          type: 'byline',
          class: 'text',
          component: FigureByline,
          constraints: {
            allowBreak: false
          }
        }
      ]
    }
  }
}
