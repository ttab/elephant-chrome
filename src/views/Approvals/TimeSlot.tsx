export const TimeSlot = ({ name, label, slots }: {
  name: string
  label: string
  slots: number[]
}): JSX.Element => {
  return (
    <div className={`
      w-[95%]
      flex-grow
      flex-shrink-0
      @lg/view:w-1/2
      @3xl/view:w-1/3
      @5xl/view:w-[25%]
      @7xl/view:w-auto
      snap-start
      border-e
      last:border-s-0
      -mx-2
      px-4
      first:ps-0
      first:ms-0
      last:pe-0
      last:me-0
      `}
    >
      <div className='w-full h-full bg-pinks-300'>
        <strong>{label}</strong>
        <p>{slots.join(',')}</p>
      </div>
    </div>
  )
}
