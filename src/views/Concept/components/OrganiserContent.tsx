import { Form } from '@/components/Form'
import { TextBox } from '@/components/ui'

export const OrganiserContent = ({ isActive, handleChange, asDialog }: {
  isActive: boolean
  handleChange: (value: boolean) => void
  asDialog: boolean | undefined
}) => {
  return (
    <Form.Content>
      <TextBox
        id='organiser'
        label='Organisatör'
        asDialog={asDialog}
        singleLine={true}
        path='root.title'
        className={isActive ? 'border' : ''}
        onChange={handleChange}
        placeholder='Titel'
        disabled={!isActive}
      />
      <TextBox
        id='email'
        label='E-postadress'
        asDialog={asDialog}
        singleLine={true}
        path='meta.core/contact-info[0].data.email'
        className={isActive ? 'border' : ''}
        onChange={handleChange}
        placeholder='E-postaddress'
        disabled={!isActive}
      />
      <TextBox
        id='phone'
        label='Telefon'
        asDialog={asDialog}
        singleLine={true}
        path='meta.core/contact-info[0].data.phone'
        className={isActive ? 'border' : ''}
        onChange={handleChange}
        placeholder='Telefon'
        disabled={!isActive}
      />
      <TextBox
        id='streetAddress'
        label='Adress'
        asDialog={asDialog}
        singleLine={true}
        path='meta.core/contact-info[0].data.streetAddress'
        className={isActive ? 'border' : ''}
        onChange={handleChange}
        placeholder='Adress'
        disabled={!isActive}
      />
      <TextBox
        id='city'
        label='Stad'
        asDialog={asDialog}
        singleLine={true}
        path='meta.core/contact-info[0].data.city'
        className={isActive ? 'border' : ''}
        onChange={handleChange}
        placeholder='Stad'
        disabled={!isActive}
      />
      <TextBox
        id='country'
        label='Land'
        asDialog={asDialog}
        singleLine={true}
        path='meta.core/contact-info[0].data.country'
        className={isActive ? 'border' : ''}
        onChange={handleChange}
        placeholder='Land'
        disabled={!isActive}
      />
      <TextBox
        id='link'
        label='Länkar'
        asDialog={asDialog}
        singleLine={true}
        path='links[text/html][0].url'
        className={isActive ? 'border' : ''}
        onChange={handleChange}
        placeholder='URL'
        disabled={!isActive}
      />
    </Form.Content>
  )
}
