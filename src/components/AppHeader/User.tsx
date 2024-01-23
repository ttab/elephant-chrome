import { useSession } from '@/hooks'
import {
  Popover,
  PopoverTrigger,
  PopoverContent
} from '@ttab/elephant-ui'
import { Avatar } from '@/components'

export const User = (): JSX.Element => {
  const { jwt } = useSession()

  return (
    <Popover>

      <PopoverTrigger className='mr-2'>
        <Avatar variant='menu' value={jwt?.sub_name || '??'} />
      </PopoverTrigger>

      <PopoverContent className="w-80" sideOffset={20} align='end' alignOffset={15}>
        <div className="space-y-2">
          <h4 className="font-medium leading-none">User</h4>
          <p className="text-sm text-muted-foreground">
            {jwt?.sub_name}
          </p>
          {jwt?.units.map((unit: string, index: number) => {
            return (
              <p key={index} className="text-sm text-muted-foreground">
                {unit}
              </p>
            )
          })}
          <p className="text-sm text-muted-foreground">
            {jwt?.scope}
          </p>
        </div>
      </PopoverContent>

    </Popover>
  )
}
