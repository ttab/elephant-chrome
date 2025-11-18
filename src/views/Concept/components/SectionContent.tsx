import { Form } from '@/components/Form'
import { TextBox } from '@/components/ui'
import { Validation } from '@/components/Validation'

export const SectionContent = ({ isActive, handleChange }: {
  isActive: boolean
  handleChange: (value: boolean) => void
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
      <Validation
        path='meta.core/section[0].data.code'
        label='code'
        block='meta.core/section[0].data.code'
      >
        <TextBox
          onChange={handleChange}
          singleLine={true}
          path='meta.core/section[0].data.code'
          className={isActive ? 'border-[1px]' : ''}
          placeholder='Kod'
          disabled={!isActive}
        >
        </TextBox>
      </Validation>
    </Form.Content>
  )
}
