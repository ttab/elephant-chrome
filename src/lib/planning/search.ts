import { type JWT } from '@/types'

const host = 'repository.stage.tt.se'
const port = 443
const url = `https://${host}:${port}`

export const search = async (jwt: JWT): Promise<unknown> => {
  const headers = {
    Authorization: `Bearer ${JSON.stringify(jwt)}`,
    'Content-Type': 'application/json'
  }

  const indexName = 'core_planning_item'

  const result = await fetch(`${url}/${indexName}/_search`, {
    method: 'POST',
    mode: 'no-cors',
    headers,
    body: JSON.stringify(query)
  })

  console.log(JSON.stringify(result, null, 2))
  return result
}


const query = {
  query: {
    bool: {
      must: [
        {
          term: {
            'document.meta.core_assignment.data.start_date': '2023-10-01T00:00:00Z'
          }
        }
      ]
    }
  },
  _source: true,
  fields: [
    'document.title',
    'heads.usable.*'
  ],
  sort: [
    { 'document.meta.core_planning_item.data.priority': 'asc' }
  ]
}
