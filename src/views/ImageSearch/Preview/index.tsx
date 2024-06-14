
import { ttninjs } from '@ttab/api-client'
import { Button } from '@ttab/elephant-ui'

export function Preview(props: { ttninjs: ttninjs }) {
  const { ttninjs } = props


  return (

    <div className='flex flex-col'>
      <div><h3>{ttninjs.headline}</h3></div>
      <img
        src={`${ttninjs.uri}_WatermarkPreview.jpg`}
      />
      <div>Toolbar</div>
      <div className='overflow-auto max-h-56'>{ttninjs.description_text}</div>
      <div>Restrictions</div>
      <div className='flex justify-end'><Button>Infoga bild</Button></div>
    </div>
  )
}