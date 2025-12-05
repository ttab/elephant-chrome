import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@ttab/elephant-ui'
import type { YDocument } from '@/modules/yjs/hooks'
import { useYValue } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
import { Block } from '@ttab/elephant-api/newsdoc'
import { useEditorialInfoTypes } from '../hooks/useEditorialInfoType'
import type { JSX } from 'react'

export const EditorialInfoTypes = ({ ydoc }: {
  ydoc: YDocument<Y.Map<unknown>>
}): JSX.Element => {
  const [type, setType] = useYValue<Block | undefined>(ydoc.ele, 'links.core/editorial-info-type[0]')

  const editorialInfoTypes = useEditorialInfoTypes()
  const onValueChange = (value: string) => {
    if (value === 'empty') {
      setType(undefined)
      return
    }

    const editorialInfoBlock = Block.create({
      uuid: value,
      type: 'tt/editorial-info-type',
      rel: 'info-type'

    })

    setType(editorialInfoBlock)
  }

  return (
    <Select onValueChange={onValueChange} name='EditorialInfoType' defaultValue={type?.uuid || 'empty'}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {[{ id: 'empty', title: 'Ingen typ' }, ...editorialInfoTypes]?.map((item) =>
          <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>
        )}
      </SelectContent>
    </Select>
  )
}
