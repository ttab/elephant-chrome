import { type Plugin } from '@ttab/textbit'
import { CONFIG } from '../config'

export const consumes: Plugin.ConsumesFunction = ({ input }) => {
  if (!(input.data instanceof File)) {
    return [false]
  }
  const { size, type } = input.data

  if (!['image/png', 'image/jpg', 'image/jpeg', 'image/gif'].includes(type)) {
    // console.info(`Image mime type ${input.type} not supported`)
    return [false]
  }

  // Hardcoded limit on 50 MB
  if (size / 1024 / 1024 > CONFIG.maxSizeInMb) {
    // console.info(`Image is too large, ${size / 1024 / 1024}, max ${CONFIG.maxSizeInMb} Mb allowed`)
    return [false]
  }

  return [true, 'core/image', false]
}
