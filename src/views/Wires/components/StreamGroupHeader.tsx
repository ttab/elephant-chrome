export const StreamGroupHeader = ({ date, time }: { date?: string, time?: string }) => {
  return (
    <div
      className='
        sticky top-0
        h-7
        bg-muted px-3 py-1.5
        text-xs text-muted-foreground
        border-y
      '
    >
      {time && <span>{time}</span>}
      {date && time && <span className='mx-2'></span>}
      {date && <span>{date}</span>}
    </div>
  )
}
