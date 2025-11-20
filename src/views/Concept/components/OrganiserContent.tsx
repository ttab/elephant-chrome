import { Form } from '@/components/Form'
import { TextBox } from '@/components/ui'
import { Validation } from '@/components/Validation'
import { getValueByYPath, stringToYPath } from '@/shared/yUtils'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ttab/elephant-ui'
import { ExternalLinkIcon } from '@ttab/elephant-ui/icons'

export const OrganiserContent = ({ isActive, handleChange, asDialog, provider }: {
  isActive: boolean
  handleChange: (value: boolean) => void
  asDialog: boolean | undefined
  provider: HocuspocusProvider
}) => {
  const links: string[] = provider?.document.getMap('ele').toJSON().links['text/html']
  const phone = provider?.document.getMap('ele').toJSON().meta['core/contact-info'][0].data.phone
  const LinkIcon = <ExternalLinkIcon size={18} strokeWidth={1.75} className='mr-2' />
  const openLink = (path: string) => {
    const yRoot = provider?.document.getMap('ele')
    const yPath = stringToYPath(path)
    const [link] = getValueByYPath<string>(yRoot, yPath, false)
    window.open(link)
  }
  return (
    <Form.Content>
      <Validation
        path='root.title'
        label='title'
        block='root.title'
      >
        <TextBox
          id='organiser'
          label='Organisatör'
          asDialog={asDialog}
          singleLine={true}
          path='root.title'
          className={isActive ? 'border' : ''}
          onChange={handleChange}
          placeholder='Organistörens namn'
          disabled={!isActive}
        />
      </Validation>
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
      {links.length > 0
        && links.map((link, i) => {
          return (
            <TextBox
              key={link}
              id='link'
              label='Länkar'
              asDialog={asDialog}
              singleLine={true}
              path={`links[text/html][${0}].url`}
              className={isActive ? 'border truncate' : 'truncate'}
              onChange={handleChange}
              placeholder='Website url'
              disabled={!isActive}
              icon={LinkIcon}
              iconAction={() => openLink(`links[text/html][${i}].url`)}
            />
          )
        })}
    </Form.Content>
  )
}
