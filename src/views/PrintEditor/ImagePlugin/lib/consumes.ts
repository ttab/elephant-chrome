import { type TBConsumesFunction } from '@ttab/textbit'
import { CONFIG } from '../config'

export const consumes: TBConsumesFunction = ({ input }) => {
  if (!(input.data instanceof File)) {
    return [false]
  }
  const { size, type } = input.data

  if (!['image/png', 'image/jpg', 'image/jpeg', 'image/gif'].includes(type)) {
    return [false]
  }

  // Hardcoded limit on 50 MB
  if (size / 1024 / 1024 > CONFIG.maxSizeInMb) {
    console.info(`Image is too large, ${size / 1024 / 1024}, max ${CONFIG.maxSizeInMb} Mb allowed`)
    return [false]
  }

  return [true, 'core/image']
}
