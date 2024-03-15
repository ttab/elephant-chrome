import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '@ttab/elephant-ui'
import { useYObserver } from '@/hooks'
import { AssignmentTypes } from '@/defaults'

export const AssignmentType = ({ index }: { index: number }): JSX.Element => {
  const { get, set } = useYObserver('planning', `meta.core/assignment[${index}].meta.core/assignment-type[0]`)

  const data = AssignmentTypes.find(type => type.value === get('value'))

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost'>
          {data?.icon &&
            <data.icon strokeWidth={1.75} size={18} />
          }
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-40'>
        <DropdownMenuRadioGroup
          value={get('value') as string}
          onValueChange={(value) => { set(value, 'value') }}
        >
          {AssignmentTypes.map(type => {
            return <DropdownMenuRadioItem
              key={type.value}
              value={type.value}
            >
              <div className='flex place-items-center'>
                {type?.icon &&
                  <type.icon
                    size={18}
                    strokeWidth={1.75}
                    className='text-muted-foreground mr-2'
                  />}
                {type.label}
              </div>
            </DropdownMenuRadioItem>
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
