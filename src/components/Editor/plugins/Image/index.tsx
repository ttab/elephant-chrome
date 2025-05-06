import { type Plugin } from '@ttab/textbit'
import { ImageIcon } from '@ttab/elephant-ui/icons'

import {
  Figure,
  FigureImage,
  FigureText
} from './components'
import { consume } from './lib/consume'
import { consumes } from './lib/consumes'
import { normalizeImage } from './lib/normalizeImage'
import { actionHandler } from './lib/actionHandler'

export const Image: Plugin.InitFunction = () => {
  return {
    class: 'block',
    name: 'core/image',
    consumer: {
      consumes,
      consume
    },
    actions: [
      {
        name: 'insert-image',
        title: 'Image',
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
        }
      ]
    }
  }
}
