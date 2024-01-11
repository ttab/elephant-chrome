import { useSession } from '@/hooks'
import { getInitials } from '@/lib/getInitials'
import {
  Avatar as AvatarMain,
  AvatarFallback,
  Popover,
  PopoverTrigger,
  PopoverContent
} from '@ttab/elephant-ui'

export const Avatar = (): JSX.Element => {
  const { jwt } = useSession()

  return (
    <Popover>

      <PopoverTrigger className='mr-2'>
        <AvatarMain className='h-8 w-8 mt-1'>
          <AvatarFallback
            className='bg-[#973C9F] border-2 text-background dark:text-foreground text-sm font-semibold leading-6'
          >
            {jwt?.sub_name ? getInitials(jwt?.sub_name) : '??'}
          </AvatarFallback>
        </AvatarMain>
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
