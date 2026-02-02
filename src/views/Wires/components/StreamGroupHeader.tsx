export const StreamGroupHeader = ({ date, time }: { date?: string, time?: string }) => {
  return (
    <div
      className='
        sticky top-0 z-10
        h-7
        bg-muted px-3 py-1.5
        text-xs text-muted-foreground
        border-b
      '
    >
      {time && <span>{time}</span>}
      {date && time && <span className='mx-2'></span>}
      {date && <span>{date}</span>}
    </div>
  )
}
