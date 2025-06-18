import type { Repository } from '@/shared/Repository'
import { TextbitEditor, type Plugin } from '@ttab/textbit'
import { type BaseEditor, Transforms } from 'slate'

/**
 * Consume a FileList and produce an array of core/image objects
 */
export const consume = (input: Plugin.Resource | Plugin.Resource[], repository: Repository, accessToken: string): Promise<Plugin.Resource | undefined> => {
  console.log(' :8 ~ consume ~ input', input)
  if (Array.isArray(input)) {
    throw new Error('Image plugin expected File for consumation, not a list/array')
  }

  if (!(input.data instanceof File)) {
    throw new Error('Image plugin expected File for consumation, wrong indata')
  }

  const { name, type, size } = input.data

  return {
    ...input,
    data: {
      id: crypto.randomUUID(),
      class: 'block',
      type: 'core/image',
      properties: {
        href: name,
        uri: `core://image/uri`,
        rel: 'self',
        text: name,
        src: '',
        width: 800,
        height: 600,
        type
      },
      children: [
        {
          type: 'core/image/image',
          class: 'text',
          children: [{ text: 'props.href' }]
        },
        {
          type: 'core/image/text',
          class: 'text',
          children: [{ text: name }]
        }
      ]
    }
  }
  // const readerPromise = new Promise<Plugin.Resource>((resolve, reject) => {
  //   const reader = new FileReader()
  //   repository.uploadFile(name, type, input.data as File, accessToken)
  //     .then(({ uuid }) => {
  //       console.log(' :20 ~ .then ~ uuid', uuid)
  //       console.log('reader', reader)
  //       repository.getAttachmentDetails(uuid, accessToken)
  //         .then((details) => {
  //           console.log('DETAILS', details)
  //           reader.addEventListener('load', () => {
  //             if (typeof reader.result !== 'string') {
  //               reject(new Error(`Error when image dropped, resulted in ${typeof reader.result}`))
  //               return
  //             }
  //             const tmpImage = new Image()
  //             tmpImage.src = details.downloadLink
  //             // tmpImage.onload = () => {
  //             //   // FIXME: Ensure this is the correct image (textbit element) structure
  //             //   // FIXME: and that the image is rendered using FigureImage component.
  //             //   console.log('RESOLVING...')

  //             resolve({
  //               ...input,
  //               data: {
  //                 type: 'core/image',
  //                 id: uuid,
  //                 class: 'block',
  //                 properties: {
  //                   href: details.downloadLink,
  //                   type: details.contentType,
  //                   src: details.downloadLink, // FIXME: Should be removed as the src url is fetched from a backend on render
  //                   title: details.filename,
  //                   size: Number(size),
  //                   width: 800,
  //                   height: 600
  //                 },
  //                 children: [
  //                   {
  //                     type: 'core/image/image',
  //                     class: 'text',
  //                     children: [{ text: '' }]
  //                   },
  //                   {
  //                     type: 'core/image/text',
  //                     class: 'text',
  //                     children: [{ text: '' }]
  //                   }
  //                 ]
  //               }
  //             })
  //             //   resolve(node)
  //             // }
  //           }, false)
  //         }).catch((err) => console.error(err))

  //       return reader.readAsDataURL(input.data as Blob)
  //     }).catch((ex) => {
  //       throw ex
  //     })
  // })
  // // const position = TextbitEditor.position(editor)
  // // TextbitEditor.insertAt(editor, position, await readerPromise)

  // // Transforms.select(editor, {
  // //   anchor: { offset: 0, path: [position, 0, 0] },
  // //   focus: { offset: 0, path: [position, 0, 0] }
  // // })
  // console.log('return')
  // const result = await readerPromise
  // console.log('the result', result)
  // return result
  // return await readerPromise
}
