import type { HitV1 } from '@ttab/elephant-api/index'

export function withStatus(hits: HitV1[]): HitV1[] {
  return hits?.map((item: HitV1) => {
    const status = getCurrentDocumentStatus(item)
    return {
      ...item,
      fields: {
        ...item.fields,
        'document.meta.status': {
          values: [status]
        }
      }
    }
  })
}

function getCurrentDocumentStatus(obj: HitV1): string {
  const defaultStatus = 'draft'
  const createdValues = Object.entries(obj.fields)
    .filter(([key, value]) =>
      key.startsWith('heads.')
      && key.endsWith('.created')
      && Array.isArray(value?.values)
    )
    .map(([key, value]) => ({
      status: key.split('heads.')[1].replace('.created', ''),
      created: value.values[0]
    }))

  createdValues.sort((a, b) => (a.created > b.created ? -1 : 1))
  return createdValues[0]?.status || defaultStatus
}
