import { render, fireEvent } from '@testing-library/react'
import * as Y from 'yjs'
import { Form } from '@/components/Form'
import { SluglineEditable } from '@/components/DataItem/SluglineEditable'
import type { YDocument } from '@/modules/yjs/hooks'

vi.mock('@/hooks/useFeatureFlags', () => ({ useFeatureFlags: () => ({ hasLooseSlugline: false }) }))
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { sub: 'sub1' } }, status: 'authenticated' })
}))
vi.mock('@/components/ui', () => ({
  TextBox: () => <span role='textbox' data-slate-placeholder='true'>slugline</span>
}))

// Build a real Y.Doc with an integrated but empty slugline Y.XmlText.
const buildYdoc = (synced: boolean): { ydoc: YDocument<Y.Map<unknown>>, value: Y.XmlText } => {
  const doc = new Y.Doc()
  const root = doc.getMap('ele')
  const meta = new Y.Map()
  root.set('meta', meta)
  const arr = new Y.Array<Y.Map<unknown>>()
  meta.set('tt/slugline', arr)
  const block = new Y.Map()
  arr.push([block])
  block.set('type', 'tt/slugline')
  const value = new Y.XmlText()
  block.set('value', value)

  const ydoc = { ele: root, ctx: new Y.Map(), synced } as unknown as YDocument<Y.Map<unknown>>

  return { ydoc, value }
}

const renderDialogForm = (ydoc: YDocument<Y.Map<unknown>>, value: Y.XmlText) => {
  const onSubmit = vi.fn()
  const utils = render(
    <Form.Root asDialog>
      <Form.Content>
        <Form.Group>
          <SluglineEditable ydoc={ydoc} value={value} />
        </Form.Group>
      </Form.Content>
      <Form.Footer>
        <Form.Submit onSubmit={onSubmit}>
          <button type='submit'>submit</button>
        </Form.Submit>
      </Form.Footer>
    </Form.Root>
  )

  return { ...utils, onSubmit }
}

describe('Validation indicator on dialog forms', () => {
  it('shows the red indicator for an empty required field before the document is synced', () => {
    const { ydoc, value } = buildYdoc(false)
    const { container, onSubmit } = renderDialogForm(ydoc, value)

    fireEvent.click(container.querySelector('button[type="submit"]') as HTMLButtonElement)

    // Submit is blocked because the field is empty...
    expect(onSubmit).not.toHaveBeenCalled()
    // ...and the user must get a visible cue, even though synced is still false.
    expect(container.querySelector('svg[stroke="red"]')).toBeTruthy()
  })

  it('still shows the indicator once the document is synced', () => {
    const { ydoc, value } = buildYdoc(true)
    const { container, onSubmit } = renderDialogForm(ydoc, value)

    fireEvent.click(container.querySelector('button[type="submit"]') as HTMLButtonElement)

    expect(onSubmit).not.toHaveBeenCalled()
    expect(container.querySelector('svg[stroke="red"]')).toBeTruthy()
  })
})
