import { Form } from '@/components/Form'
import { TextBox } from '@/components/ui'
import { Validation } from '@/components/Validation'
import { getValueByYPath, stringToYPath } from '@/shared/yUtils'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import { ExternalLinkIcon } from '@ttab/elephant-ui/icons'

export const OrganiserContent = ({ isActive, handleChange, asDialog, provider }: {
  isActive: boolean
  handleChange: (value: boolean) => void
  asDialog: boolean | undefined
  provider: HocuspocusProvider
}) => {
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
          className={isActive ? 'border' : 'bg-slate-100 text-slate-500'}
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
        className={isActive ? 'border' : 'bg-slate-100 text-slate-500'}
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
        className={isActive ? 'border' : 'bg-slate-100 text-slate-500'}
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
        className={isActive ? 'border' : 'bg-slate-100 text-slate-500'}
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
        className={isActive ? 'border' : 'bg-slate-100 text-slate-500'}
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
        className={isActive ? 'border' : 'bg-slate-100 text-slate-500'}
        onChange={handleChange}
        placeholder='Telefon'
        disabled={!isActive}
      />
      <TextBox
        id='link'
        label='Länkar'
        asDialog={asDialog}
        singleLine={true}
        path={`links[text/html][${0}].url`}
        className={isActive ? 'border truncate' : 'bg-slate-100 text-slate-500 truncate'}
        onChange={handleChange}
        placeholder='Website url'
        disabled={!isActive}
        icon={LinkIcon}
        iconAction={() => openLink(`links[text/html][0].url`)}
      />
    </Form.Content>
  )
}
