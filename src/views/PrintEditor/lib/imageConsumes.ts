import { type TBConsumesFunction } from '@ttab/textbit'

const MAX_SIZE_MB = 50

export const imageConsumes: TBConsumesFunction = ({ input }) => {
  if (!(input.data instanceof File)) {
    return [false]
  }
  const { size, type } = input.data

  if (!['image/png', 'image/jpg', 'image/jpeg', 'image/gif'].includes(type)) {
    return [false]
  }

  // Hardcoded limit on 50 MB
  if (size / 1024 / 1024 > MAX_SIZE_MB) {
    console.info(`Image is too large, ${size / 1024 / 1024}, max ${MAX_SIZE_MB} Mb allowed`)
    return [false]
  }

  return [true, 'core/image']
}
