import type { Repository } from '@/shared/Repository'
import type { TBResource } from '@ttab/textbit'
import { getCachedSession } from '@/shared/getCachedSession'
import { toast } from 'sonner'

export const consume = async (
  input: TBResource | TBResource[],
  repository: Repository
): Promise<TBResource | undefined> => {
  if (Array.isArray(input)) {
    throw new Error('Image plugin expected File for consumation, not a list/array')
  }

  if (!(input.data instanceof File)) {
    throw new Error('Image plugin expected File for consumation, wrong indata')
  }

  const { name, type: contentType, size } = input.data
  const isLikelyImage = (() => {
    if (contentType?.startsWith('image/')) {
      return true
    }
    const extension = name.split('.').pop()?.toLowerCase()
    const whitelistedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg', 'bmp', 'tiff', 'heic', 'heif']
    return extension ? whitelistedExtensions.includes(extension) : false
  })()

  if (!isLikelyImage) {
    toast.error('Filen verkar inte vara en bild, avbryter uppladdning')
    throw new Error('Unsupported file type, expected an image')
  }

  const getImageProperties = async () => {
    const session = await getCachedSession()

    if (!session) {
      throw new Error('No session found, user must be logged in to upload images')
    }

    return await new Promise<TBResource>((resolve, reject) => {
      const reader = new FileReader()
      const tmpImage = new Image()
      let cancelled = false

      const cancel = (toastMessage: string, errorMessage: string) => {
        if (cancelled) {
          return
        }
        cancelled = true
        toast.error(toastMessage)
        reject(new Error(errorMessage))
      }

      reader.onerror = (event: ProgressEvent<FileReader>) => {
        const readerTarget = (event?.target) ?? reader
        const readerError = readerTarget?.error ?? reader.error ?? null
        const errorName = readerError?.name ?? 'UnknownError'
        const errorMessage = readerError?.message ?? 'Failed to read file as data URL'
        console.error(`ImagePlugin: reader error (${errorName})`, readerError ?? event)
        cancel(`Bilden kunde inte läsas (${errorName})`, errorMessage)
        reader.abort()
        tmpImage.src = ''
      }

      tmpImage.onerror = (e) => {
        console.error('ImagePlugin: image load error', e)
        cancel('Bilden kunde inte tolkas, kontrollera att filen inte är korrupt', 'Image failed to load')
      }


      repository
        .uploadFile(name, contentType, input.data as File, session?.accessToken)
        .then(({ uuid, name }) => {
          reader.onload = () => {
            if (typeof reader.result !== 'string') {
              reject(new Error(`ImagePlugin: Error when image dropped, resulted in ${typeof reader.result}`))
              return
            }

            if (!reader.result.startsWith('data:image/')) {
              toast.error('Innehållet identifierades inte som en bild')
              reject(new Error('ImagePlugin: Reader result is not an image data URL'))
              return
            }

            tmpImage.src = reader.result

            tmpImage.onload = () => {
              if (cancelled) {
                return
              }

              const hasDimensions = Boolean(tmpImage.naturalWidth && tmpImage.naturalHeight)
              if (!hasDimensions) {
                cancel('Bilden saknar giltiga dimensioner', 'ImagePlugin: Image has invalid dimensions')
                return
              }

              toast.success('Bilduppladdning lyckades!')
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
                      class: 'void',
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
