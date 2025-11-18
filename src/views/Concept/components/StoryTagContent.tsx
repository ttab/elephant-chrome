import { Form } from '@/components/Form'
import { TextBox } from '@/components/ui'
import { Validation } from '@/components/Validation'

export const StoryTagContent = ({ isActive, handleChange, textPaths, asDialog }: {
  isActive: boolean
  handleChange: (value: boolean) => void
  textPaths: { shortIndex: number, longIndex: number } | undefined
  asDialog: boolean | undefined
}) => {
  return (
    <Form.Content>
      <Validation
        path='root.title'
        label='title'
        block='root.title'
      >
        <TextBox
          id='storyTag'
          label='Story tag'
          asDialog={asDialog}
          singleLine={true}
          path='root.title'
          className={isActive ? 'border' : 'bg-slate-100 text-slate-500'}
          onChange={handleChange}
          placeholder='Titel'
          disabled={!isActive}
        />
      </Validation>
      <TextBox
        id='shortText'
        label='Kort text'
        asDialog={asDialog}
        singleLine={true}
        path={`meta.core/definition[${textPaths?.shortIndex}].data.text`}
        className={isActive ? 'border' : 'bg-slate-100 text-slate-500'}
        onChange={handleChange}
        placeholder='Kort text'
        disabled={!isActive}
      />
      <TextBox
        id='longText'
        label='Lång text'
        asDialog={asDialog}
        singleLine={false}
        path={`meta.core/definition[${textPaths?.longIndex}].data.text`}
        className={isActive ? 'border' : 'bg-slate-100 text-slate-500'}
        onChange={handleChange}
        placeholder='Lång text'
        disabled={!isActive}
      />
    </Form.Content>
  )
}
