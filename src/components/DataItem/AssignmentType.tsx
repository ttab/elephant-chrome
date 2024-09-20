import { AssignmentTypes } from '@/defaults'
import { ComboBox } from '@ttab/elephant-ui'
import { cn } from '@ttab/elephant-ui/utils'
import { Block } from '@/protos/service'
import { useYValue } from '@/hooks/useYValue'

export const AssignmentType = ({ path, editable = false }: {
  path: string
  editable?: boolean
}): JSX.Element => {
  const [assignmentType, setAssignmentType] = useYValue<Block[] | undefined>(path)


  const selectedOptions = AssignmentTypes.filter(type => {
    const value = assignmentType?.map ? assignmentType.map((s) => s.value).sort().join('/') : ''
    return type.value === value
  })

  const { className = '', ...iconProps } = selectedOptions[0]?.iconProps || {}

  const SelectedIcon = selectedOptions?.[0]?.icon

  if (!editable) {
    return <>
      {SelectedIcon
        ? <SelectedIcon {...selectedOptions[0].iconProps} className={cn('text-foreground', className)} />
        : selectedOptions[0]?.label
      }
    </>
  }

  return <ComboBox
    max={1}
    sortOrder='label'
    className='w-fit px-2'
    options={AssignmentTypes}
    variant={'ghost'}
    selectedOptions={selectedOptions}
    onSelect={(option) => {
      if (option.value === 'picture/video') {
        setAssignmentType([Block.create({
          type: 'core/assignment-type',
          value: 'picture'
        }),
        Block.create({
          type: 'core/assignment-type',
          value: 'video'
        })])
      } else {
        setAssignmentType([Block.create({
          type: 'core/assignment-type',
          value: option.value
        })])
      }
    }}
  >
    {SelectedIcon
      ? <SelectedIcon {...iconProps} className={cn('text-foreground', className)} />
      : selectedOptions[0]?.label
    }
  </ComboBox>
}
