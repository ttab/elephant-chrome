import { Input, PopoverTrigger } from "@ttab/elephant-ui"
import { Popover } from "@ttab/elephant-ui"

export const TimePicker = (trigger) => {
  return (
    <Popover>
      <PopoverTrigger>
        {trigger}
      </PopoverTrigger>
      <div>
        <Input
          type="datetime-local"
        />
      </div>
    </Popover>
  )
}