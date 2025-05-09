import { AssignmentTypes } from '@/defaults'
import { Button, Select, SelectContent, SelectItem, SelectTrigger } from '@ttab/elephant-ui'
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
  const [assignmentType, setAssignmentType] = useYValue<Block[]>(path + '.meta.core/assignment-type')
  const [, setAssignmentVisibility] = useYValue<string>(path + 'data.public')

  const selectedOptions = AssignmentTypes.filter((type) => {
    const value = assignmentType?.map ? assignmentType.map((s) => s.value).sort().join('/') : ''
    return type.value === value
  })

  const { className: defaultClassName = '', ...iconProps } = selectedOptions[0]?.iconProps || {}

  const SelectedIcon = getIcon(selectedOptions, editable, readOnly)

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
    <Select
      disabled={!editable}
      value={selectedOptions[0]?.value}
      onValueChange={(value) => {
        switch (value) {
          case 'picture/video':
            setAssignmentType([Block.create({
              type: 'core/assignment-type',
              value: 'picture'
            }),
            Block.create({
              type: 'core/assignment-type',
              value: 'video'
            })
            ])
            break
          case 'flash':
            setAssignmentType([Block.create({
              type: 'core/assignment-type',
              value: value
            })])
            setAssignmentVisibility('false')
            break


          default:
            setAssignmentType([Block.create({
              type: 'core/assignment-type',
              value: value
            })])
        }
      }}
    >
      <SelectTrigger className='w-fit px-2 border-0'>
        {SelectedIcon
          ? (
              <SelectedIcon
                {...iconProps}
                className={cn(defaultClassName, className, editable ? 'text-foreground' : 'text-primary')}
              />
            )
          : selectedOptions[0]?.label}
      </SelectTrigger>
      <SelectContent>
        {AssignmentTypes.map((option) => (
          <SelectItem value={option.value} key={option.value}>
            <div className='flex flex-row gap-2'>
              {option.icon && <option.icon {...option.iconProps} />}
              {option.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function getIcon(selectedOptions: DefaultValueOption[], editable: boolean, readOnly = false) {
  if (selectedOptions[0].value !== 'text') {
    return selectedOptions[0]?.icon
  }

  if (readOnly) {
    return editable ? FilePlus2 : FilePen
  }

  return selectedOptions[0]?.icon
}
