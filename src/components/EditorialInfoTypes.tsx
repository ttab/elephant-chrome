import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@ttab/elephant-ui'
import { useYValue } from '../hooks'
import { Block } from '@ttab/elephant-api/newsdoc'
import { useEditorialInfoTypes } from '../hooks/useEditorialInfoType'

export const EditorialInfoTypes = (): JSX.Element => {
  const [type, setType] = useYValue<Block | undefined>('links.core/editorial-info-type[0]')

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
