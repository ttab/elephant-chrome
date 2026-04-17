import { FilesIcon } from '@ttab/elephant-ui/icons'


export const InfoText = ({ originalId }: { originalId: string }) => {
  return (
    <div className='my-4 mx-12 rounded border p-2'>
      <div>{`Read only version of factbox. Go to original ${originalId}`}
        <FilesIcon size={16} strokeWidth={1.75} />
      </div>
    </div>
  )
}
