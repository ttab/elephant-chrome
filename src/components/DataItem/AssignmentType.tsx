import { AssignmentTypes } from '@/defaults'
import { Button, ComboBox } from '@ttab/elephant-ui'
import { cn } from '@ttab/elephant-ui/utils'
import { Block } from '@ttab/elephant-api/newsdoc'
import { useYValue } from '@/hooks/useYValue'
import { FilePen, FilePlus2 } from '@ttab/elephant-ui/icons'
import type { DefaultValueOption } from '@/types/index'

export const AssignmentType = ({ path, editable = false, readOnly = false, className }: {
  path: string
  className?: string
  editable?: boolean
  readOnly?: boolean
}): JSX.Element => {
  const [assignmentType, setAssignmentType] = useYValue<Block[] | undefined>(path)

  const selectedOptions = AssignmentTypes.filter((type) => {
    const value = assignmentType?.map ? assignmentType.map((s) => s.value).sort().join('/') : ''
    return type.value === value
  })

  const { className: defaultClassName = '', ...iconProps } = selectedOptions[0]?.iconProps || {}

  const SelectedIcon = getIcon(selectedOptions, editable)

  if (readOnly) {
    return (
      <Button
        variant='icon'
        className='w-fit px-2'
      >
        {SelectedIcon
          ? (
              <SelectedIcon
                {...selectedOptions[0].iconProps}
                className={cn(defaultClassName, className, editable ? 'text-foreground' : 'text-primary')}
              />
            )
          : selectedOptions[0]?.label}
      </Button>
    )
  }

  return (
    <ComboBox
      max={1}
      sortOrder='label'
      className='w-fit px-2'
      options={AssignmentTypes}
      variant='ghost'
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
        ? (
            <SelectedIcon
              {...iconProps}
              className={cn(defaultClassName, className, editable ? 'text-foreground' : 'text-primary')}
            />
          )
        : selectedOptions[0]?.label}
    </ComboBox>
  )
}

function getIcon(selectedOptions: DefaultValueOption[], editable: boolean) {
  if (selectedOptions[0].value !== 'text') {
    return selectedOptions[0]?.icon
  }

  return editable ? FilePlus2 : FilePen
}
