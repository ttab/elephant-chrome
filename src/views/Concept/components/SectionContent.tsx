import { Form } from '@/components/Form'
import { TextBox } from '@/components/ui'
import { Validation } from '@/components/Validation'

export const SectionContent = ({ isActive, handleChange, asDialog }: {
  isActive: boolean
  handleChange: (value: boolean) => void
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
          id='sectionTitle'
          label={!asDialog ? 'Sektionsnamn' : undefined}
          asDialog={asDialog}
          singleLine={true}
          path='root.title'
          className={isActive ? 'border' : 'bg-slate-100 text-slate-500'}
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
          id='code'
          label={!asDialog ? 'Kod' : undefined}
          asDialog={asDialog}
          onChange={handleChange}
          singleLine={true}
          path='meta.core/section[0].data.code'
          className={isActive ? 'border' : 'bg-slate-100 text-slate-500'}
          placeholder='Kod'
          disabled={!isActive}
        >
        </TextBox>
      </Validation>
    </Form.Content>
  )
}
