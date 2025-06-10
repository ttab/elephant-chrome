import type { Repository } from '@/shared/Repository'
import { type Plugin } from '@ttab/textbit'

/**
 * Consume a FileList and produce an array of core/image objects
 */
export const consume = async (input: Plugin.Resource | Plugin.Resource[], repository: Repository, accessToken: string): Promise<Plugin.Resource | undefined> => {
  if (Array.isArray(input)) {
    throw new Error('Image plugin expected File for consumation, not a list/array')
  }

  if (!(input.data instanceof File)) {
    throw new Error('Image plugin expected File for consumation, wrong indata')
  }

  const { name, type, size } = input.data

  const readerPromise = new Promise<Plugin.Resource>((resolve, reject) => {
    const reader = new FileReader()

    reader.addEventListener('load', () => {
      if (typeof reader.result !== 'string') {
        reject(new Error(`Error when image dropped, resulted in ${typeof reader.result}`))
        return
      }

      const tmpImage = new window.Image()
      tmpImage.src = reader.result
      tmpImage.onload = () => {
        repository.uploadFile(name, type, input.data as File, accessToken)
          .then(({ uuid, name, type }) => {
            // FIXME: Investigate why not inserted
            // FIXME: Call getAttachment to get display src in component
            resolve({
              ...input,
              data: {
                id: uuid,
                class: 'block',
                type: 'core/image',
                properties: {
                  type,
                  src: 'https://billetto.imgix.net/fqz1tfi3bhaizogvfowibztwpl97?w=1200&h=675&fit=crop&auto=compress%2Cformat&rect=0%2C0%2C940%2C529&s=862785ab0d3b66272db80380444a44b5', // Should not be filled in as it is fetched from a backend on render
                  title: name,
                  size,
                  width: tmpImage.width,
                  height: tmpImage.height
                },
                children: [
                  {
                    type: 'core/image/image',
                    class: 'text',
                    children: [{ text: '' }]
                  },
                  {
                    type: 'core/image/text',
                    class: 'text',
                    children: [{ text: '' }]
                  }
                ]
              }
            })
          })
          .catch((ex) => {
            throw ex
          })
      }
    }, false)

    reader.readAsDataURL(input.data as Blob)
  })

  return await readerPromise
}
