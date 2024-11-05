import Textbit from '@ttab/textbit'

export const DropMarker = (): JSX.Element => {
  return <Textbit.DropMarker
    className="h-[3px] rounded bg-blue-400/75 dark:bg-blue-500/75 data-[state='between']:block"
  />
}
