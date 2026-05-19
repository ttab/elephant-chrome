import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { useState, type ComponentProps, type Dispatch, type SetStateAction } from 'react'
import { TimelessCategorySelect } from '@/components/TimelessCategory'
import { useTimelessCategories } from '@/hooks/useTimelessCategories'
import type { ComboBox } from '@ttab/elephant-ui'
import type * as ElephantUI from '@ttab/elephant-ui'
import type { Block } from '@ttab/elephant-api/newsdoc'

vi.mock('@/hooks/useTimelessCategories', () => ({
  useTimelessCategories: vi.fn()
}))

type ComboBoxProps = ComponentProps<typeof ComboBox>
type ComboBoxOption = NonNullable<ComboBoxProps['options']>[number]
type OnSelect = NonNullable<ComboBoxProps['onSelect']>

const capturedOnSelect: { current: OnSelect | undefined } = { current: undefined }

vi.mock('@ttab/elephant-ui', async () => {
  const actual = await vi.importActual<typeof ElephantUI>('@ttab/elephant-ui')
  return {
    ...actual,
    ComboBox: (props: ComboBoxProps) => {
      capturedOnSelect.current = props.onSelect
      return null
    }
  }
})

const CATEGORY_UUID = 'cat-uuid-1'
const CATEGORY_TITLE = 'Sport'

beforeEach(() => {
  capturedOnSelect.current = undefined
  vi.mocked(useTimelessCategories).mockReturnValue([
    { id: CATEGORY_UUID, title: CATEGORY_TITLE },
    { id: 'cat-uuid-2', title: 'Economy' }
  ])
})

/**
 * Drives `TimelessCategorySelect` via a controlled wrapper so we can observe
 * how the parent's onChange is invoked. We bypass the visual ComboBox and call
 * its `onSelect` callback directly, since that is the path that produces the
 * deselect signal in production.
 */
function renderHarness(onChange: (next: Block | undefined) => void) {
  let setExternal: Dispatch<SetStateAction<Block | undefined>> = () => {}
  const Harness = () => {
    const [value, set] = useState<Block | undefined>(undefined)
    setExternal = set
    return (
      <TimelessCategorySelect
        value={value}
        onChange={(next) => {
          set(next)
          onChange(next)
        }}
      />
    )
  }
  render(<Harness />)
  return {
    setValue: (v: Block | undefined) => {
      act(() => {
        setExternal(v)
      })
    }
  }
}

function select(option: ComboBoxOption) {
  const onSelect = capturedOnSelect.current
  if (!onSelect) throw new Error('ComboBox onSelect was not captured')
  act(() => {
    onSelect(option)
  })
}

describe('TimelessCategorySelect', () => {
  it('forwards undefined to the parent when the selected option is reselected', () => {
    const onChange = vi.fn<(next: Block | undefined) => void>()
    renderHarness(onChange)

    expect(capturedOnSelect.current).toBeDefined()
    const option: ComboBoxOption = { value: CATEGORY_UUID, label: CATEGORY_TITLE }

    select(option)
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({
      uuid: CATEGORY_UUID,
      type: 'core/timeless-category',
      rel: 'subject'
    }))

    // Reselect after the parent state has updated; CategoryPicker's deselect
    // path keys off `value?.uuid === option.value`, so we must read the
    // re-rendered onSelect (which closes over the new value).
    select(option)
    expect(onChange).toHaveBeenLastCalledWith(undefined)
  })

  it('forwards a block when a different option is picked', () => {
    const onChange = vi.fn<(next: Block | undefined) => void>()
    renderHarness(onChange)

    select({ value: 'cat-uuid-2', label: 'Economy' })
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({
      uuid: 'cat-uuid-2',
      type: 'core/timeless-category',
      rel: 'subject'
    }))
  })
})
