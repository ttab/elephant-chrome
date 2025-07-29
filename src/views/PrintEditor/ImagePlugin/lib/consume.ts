import type { Repository } from '@/shared/Repository'
import { type Plugin } from '@ttab/textbit'
import { toast } from 'sonner'

export const consume = async (
  input: Plugin.Resource | Plugin.Resource[],
  repository: Repository,
  accessToken: string
): Promise<Plugin.Resource | undefined> => {
  if (Array.isArray(input)) {
    throw new Error('Image plugin expected File for consumation, not a list/array')
  }

  if (!(input.data instanceof File)) {
    throw new Error('Image plugin expected File for consumation, wrong indata')
  }

  const { name, type: contentType, size } = input.data

  const getImageProperties = async () => {
    return await new Promise<Plugin.Resource>((resolve, reject) => {
      const reader = new FileReader()
      const tmpImage = new Image()

      reader.onerror = (e) => {
        console.error('reader error', e)
        reject(new Error('Failed to read file as data URL'))
      }

      tmpImage.onerror = (error) => {
        console.error('image load error', error)
        reject(new Error('Image failed to load'))
      }

      repository
        .uploadFile(name, contentType, input.data as File, accessToken)
        .then(({ uuid, name }) => {
          toast.success('Bilduppladdning lyckades!')
          reader.onload = () => {
            if (typeof reader.result !== 'string') {
              reject(new Error(`Error when image dropped, resulted in ${typeof reader.result}`))
              return
            }

            tmpImage.src = reader.result

            tmpImage.onload = () => {
              resolve({
                ...input,
                type: 'core/image',
                data: {
                  type: 'core/image',
                  id: uuid,
                  class: 'block',
                  properties: {
                    title: name,
                    rel: 'image',
                    size,
                    uploadId: uuid,
                    height: 600,
                    width: 800,
                    uri: `core://image/${uuid}`
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
                      children: [{ text: name }]
                    },
                    {
                      type: 'core/image/byline',
                      class: 'text',
                      children: [{ text: '' }]
                    }
                  ]
                }
              })
            }
            return tmpImage
          }

          setTimeout(() => {
            reader.readAsDataURL(input.data as Blob)
          }, 0)
        }).catch((err) => {
          toast.error(`Något gick fel när bilden laddades upp!: ${err}`)
          console.error('uploadFile error:', err)
          reject(new Error('could not upload file'))
        })
    })
  }

  return await getImageProperties()
}
