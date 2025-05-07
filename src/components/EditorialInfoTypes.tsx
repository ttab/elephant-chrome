import { useDocuments } from '@/hooks/index/useDocuments'
import { BoolQueryV1, QueryV1, RangeQueryV1 } from '@ttab/elephant-api/index'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@ttab/elephant-ui'
import { useYValue } from '../hooks'
import { Block } from '@ttab/elephant-api/newsdoc'

export const EditorialInfoTypes = (): JSX.Element => {
  const [editorialInfoType, setEditorialInfoType] = useYValue<Block | undefined>('links.core/editorial-info-type[0]')

  const { data } = useDocuments({
    documentType: 'tt/editorial-info-type',
    query: QueryV1.create({
      conditions: {
        oneofKind: 'bool',
        bool: BoolQueryV1.create({
          must: [
            {
              conditions: {
                oneofKind: 'range',
                range: RangeQueryV1.create({
                  field: 'heads.usable.version',
                  gte: '1'
                })
              }
            }
          ]
        })
      }
    }),
    fields: [
      'document.title'
    ]
  })

  const onValueChange = (value: string) => {
    const editorialInfoBlock = Block.create({
      uuid: value,
      type: 'tt/editorial-info-type',
      rel: 'info-type'

    })

    setEditorialInfoType(editorialInfoBlock)
  }


  return (
    <Select onValueChange={onValueChange} name='EditorialInfoType' defaultValue={editorialInfoType?.uuid}>
      <SelectTrigger>
        <SelectValue placeholder='Välj PM-typ...' />
      </SelectTrigger>
      <SelectContent>
        {data?.map((item) =>
          <SelectItem key={item.id} value={item.id}>{item.fields['document.title']?.values[0]}</SelectItem>
        )}
      </SelectContent>
    </Select>
  )
}
