import { Form } from '@/components/Form'
import { TextBox } from '@/components/ui'
import { Validation } from '@/components/Validation'


export const StoryTagContent = ({ isActive, handleChange, textPaths }: {
  isActive: boolean
  handleChange: (value: boolean) => void
  textPaths: { shortIndex: number, longIndex: number } | undefined
}) => {
  return (
    <Form.Content>
      <Validation
        path='root.title'
        label='title'
        block='root.title'
      >
        <TextBox
          singleLine={true}
          path='root.title'
          className={isActive ? 'border-[1px]' : ''}
          onChange={handleChange}
          placeholder='Titel'
          disabled={!isActive}
        />
      </Validation>
      <TextBox
        singleLine={true}
        path={`meta.core/definition[${textPaths?.shortIndex}].data.text`}
        className={isActive ? 'border-[1px]' : ''}
        onChange={handleChange}
        placeholder='Kort text'
        disabled={!isActive}
      />
      <TextBox
        singleLine={false}
        path={`meta.core/definition[${textPaths?.longIndex}].data.text`}
        className={isActive ? 'border-[1px]' : ''}
        onChange={handleChange}
        placeholder='Lång text'
        disabled={!isActive}
      />
    </Form.Content>
  )
}
