import { Form } from '@/components/Form'
import { TextInput } from '@/components/ui/TextInput'
import { useYValue, type YDocument } from '@/modules/yjs/hooks'
import { getValueByYPath } from '@/shared/yUtils'
import type { ViewProps } from '@/types/index'
import { ExternalLinkIcon } from '@ttab/elephant-ui/icons'
import type * as Y from 'yjs'


export const OrganiserContent = ({ ydoc, isActive, ...props }: ViewProps & {
  isActive: boolean | null
  ydoc: YDocument<Y.Map<unknown>>
}) => {
  const [link] = useYValue<Y.XmlText>(ydoc.ele, 'links[text/html][0].url', true)
  const [title] = useYValue<Y.XmlText>(ydoc.ele, 'root.title', true)
  const [streetAddress] = useYValue<Y.XmlText>(ydoc.ele, 'meta.core/contact-info[0].data.streetAddress', true)
  const [city] = useYValue<Y.XmlText>(ydoc.ele, 'meta.core/contact-info[0].data.city', true)
  const [country] = useYValue<Y.XmlText>(ydoc.ele, 'meta.core/contact-info[0].data.country', true)
  const [email] = useYValue<Y.XmlText>(ydoc.ele, 'meta.core/contact-info[0].data.email', true)
  const [phone] = useYValue<Y.XmlText>(ydoc.ele, 'meta.core/contact-info[0].data.phone', true)
  const linkUrl = getValueByYPath<string>(ydoc.ele, 'links[text/html][0].url', false)[0]
  const LinkIcon = <ExternalLinkIcon size={18} strokeWidth={1.75} className='mr-2 hover:cursor-pointer' />

  const isLinkValid = () => {
    return typeof linkUrl === 'string' && linkUrl !== ''
  }

  const openLink = () => {
    if (isLinkValid()) {
      window.open(linkUrl, '_blank', 'noopener,noreferrer')
    }
  }
  return (
    <Form.Content {...props}>
      <TextInput
        ydoc={ydoc}
        label='Organisatör'
        value={title}
        className={isActive ? 'border' : 'bg-slate-100 text-slate-500'}
        placeholder='Organisatörens namn'
        autoFocus={!!props.asDialog}
        disabled={!isActive}
        asDialog={props.asDialog}
      />

      <TextInput
        label='Adress'
        ydoc={ydoc}
        value={streetAddress}
        className={isActive ? 'border' : 'bg-slate-100 text-slate-500'}
        placeholder='Adress'
        disabled={!isActive}
        asDialog={props.asDialog}
        onValidation={() => { return true }}
      />
      <TextInput
        label='Stad'
        ydoc={ydoc}
        value={city}
        className={isActive ? 'border' : 'bg-slate-100 text-slate-500'}
        placeholder='Stad'
        disabled={!isActive}
        asDialog={props.asDialog}
        onValidation={undefined}
      />
      <TextInput
        label='Land'
        ydoc={ydoc}
        value={country}
        className={isActive ? 'border' : 'bg-slate-100 text-slate-500'}
        placeholder='Land'
        disabled={!isActive}
        asDialog={props.asDialog}
        onValidation={undefined}
      />
      <TextInput
        label='E-postadress'
        ydoc={ydoc}
        value={email}
        className={isActive ? 'border' : 'bg-slate-100 text-slate-500'}
        placeholder='E-postadress'
        disabled={!isActive}
        asDialog={props.asDialog}
        onValidation={undefined}
      />
      <TextInput
        label='Telefon'
        ydoc={ydoc}
        value={phone}
        className={isActive ? 'border' : 'bg-slate-100 text-slate-500'}
        placeholder='Telefon'
        disabled={!isActive}
        asDialog={props.asDialog}
        onValidation={undefined}
      />
      <TextInput
        label='Länkar'
        ydoc={ydoc}
        value={link}
        className={isActive ? 'border truncate' : 'bg-slate-100 text-slate-500 truncate'}
        placeholder='Website url'
        disabled={!isActive}
        icon={isLinkValid() && !props.asDialog ? LinkIcon : undefined}
        iconAction={openLink}
        asDialog={props.asDialog}
        onValidation={undefined}
      />
    </Form.Content>
  )
}
