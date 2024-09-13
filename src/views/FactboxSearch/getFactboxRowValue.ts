import { type Factbox as FactboxSchema } from '@/lib/index/schemas/factbox'

export const getFactboxRowValue = (document: FactboxSchema, path: keyof typeof document._source): string[] => {
  for (const key in document._source) {
    if (Object.prototype.hasOwnProperty.call(document._source, key)) {
      if (key === path) {
        const value: string[] = document?._source[path]
        return [value.join('\n\n')]
      }
    }
  }
  return ['']
}
