import { useYObserver } from '@/hooks'
import { AssignmentTypes } from '@/defaults'
import { ComboBox } from '../ui'
import { cn } from '@ttab/elephant-ui/utils'
import { type DefaultValueOption } from '@/types/index'
import * as Y from 'yjs'
import { toYMap } from '../../../src-srv/utils/transformations/lib/toYMap'
import { Block } from '@/protos/service'

export const AssignmentType = ({ path, editable = false }: {
  path: string
  editable?: boolean
}): JSX.Element => {
  const { get, state, loading } = useYObserver('meta', path)

  if (loading) {
    return <></>
  }

  const value = state.map((s) => s.value).sort().join('/')

  const selectedOption = AssignmentTypes.find(type => type.value === value)

  const { className = '', ...iconProps } = selectedOption?.iconProps || {}

  if (!editable) {
    return <>
      {selectedOption?.icon
        ? <selectedOption.icon {...iconProps} className={cn('text-foreground', className)} />
        : selectedOption?.label
      }
    </>
  }

  const handleOnSelect = (get: (key: string) => unknown): (option: DefaultValueOption) => void => {
    return (option) => {
      // Get current array, then get its parent. This is meta Y.Map
      const currentArray = (get('') as Y.Array<unknown>).parent as Y.Array<Y.Map<unknown>>
      const parent = currentArray?.parent as Y.Map<unknown>

      if (parent) {
        // Create new Y.Array to replace current assignment types
        const newArray = new Y.Array()

        // If selected option is composit picture/video, create two new maps
        if (option.value === 'picture/video') {
          const picture = toYMap(Block.create({
            value: 'picture'
          }) as unknown as Record<string, unknown>)
          const video = toYMap(Block.create({
            value: 'video'
          }) as unknown as Record<string, unknown>)

          newArray.push([picture, video])
          // If selected option is not composite, create one new map
        } else {
          const newMap = toYMap(Block.create({
            value: option.value
          }) as unknown as Record<string, unknown>)
          newArray.push([newMap])
        }
        parent.set('core/assignment-type', newArray)
      }
    }
  }

  return <ComboBox
    className='w-fit px-2 h-7'
    options={AssignmentTypes}
    variant={'ghost'}
    selectedOption={selectedOption}
    onSelect={handleOnSelect(get)}
  >
    {selectedOption?.icon
      ? <selectedOption.icon {...iconProps} className={cn('text-foreground', className)} />
      : selectedOption?.label
    }
  </ComboBox>
}
