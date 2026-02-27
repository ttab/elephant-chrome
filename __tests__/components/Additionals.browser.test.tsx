import { render } from 'vitest-browser-react'

import { expect, test, vi, beforeEach } from 'vitest'
import { matchScreenshot } from '../utils/matchScreenshot'
import * as Y from 'yjs'
import { Block, type Document } from '@ttab/elephant-api/newsdoc'
import type { YDocument } from '@/modules/yjs/hooks/useYDocument'
import { Additionals } from '@/views/PrintEditor/components/Additionals'
import { useYValue } from '@/modules/yjs/hooks/useYValue'

vi.mock('@/modules/yjs/hooks/useYValue', () => ({
  useYValue: vi.fn()
}))

const mockDoc = new Y.Doc()
const mockEle = mockDoc.getMap('ele')
const mockYdoc = { ele: mockEle } as YDocument<Y.Map<unknown>>

const mockLayout: Document = {
  uuid: 'layout-uuid',
  type: 'core/layout',
  uri: 'test://layout',
  url: 'https://test.com/layout',
  title: 'Test Layout',
  content: [
    Block.create({
      id: 'slot-1',
      type: 'tt/print-slot',
      name: 'test-slot',
      meta: [
        Block.create({
          id: 'meta-1',
          type: 'tt/print-features',
          content: [
            Block.create({
              id: 'f1',
              type: 'core/text',
              name: 'Feature 1',
              value: 'feature1'
            }),
            Block.create({
              id: 'f2',
              type: 'core/text',
              name: 'Feature 2',
              value: 'feature2'
            })
          ]
        })
      ]
    })
  ],
  meta: [],
  links: [],
  language: 'sv'
}

beforeEach(() => {
  vi.clearAllMocks()
})

test('renders checkboxes from layout features', async () => {
  const mockAdditionals = [
    Block.create({ type: 'tt/print-feature', name: 'Feature 1', value: 'true' }),
    Block.create({ type: 'tt/print-feature', name: 'Feature 2', value: 'false' })
  ]

  vi.mocked(useYValue)
    .mockReturnValueOnce([mockAdditionals, vi.fn()])
    .mockReturnValueOnce(['test-slot', vi.fn()])

  const screen = await render(
    <Additionals
      ydoc={mockYdoc}
      basePath='root.links[0].data.articles[0]'
      layout={mockLayout}
    />
  )

  await expect.element(screen.getByRole('checkbox', { name: 'Feature 1' })).toBeVisible()
  await expect.element(screen.getByRole('checkbox', { name: 'Feature 2' })).toBeVisible()
  await matchScreenshot(document.body)
})

test('toggles checkbox on click', async () => {
  const mockSetAdditionals = vi.fn()
  const mockAdditionals = [
    Block.create({ type: 'tt/print-feature', name: 'Feature 1', value: 'false' }),
    Block.create({ type: 'tt/print-feature', name: 'Feature 2', value: 'false' })
  ]

  vi.mocked(useYValue)
    .mockReturnValueOnce([mockAdditionals, mockSetAdditionals])
    .mockReturnValueOnce(['test-slot', vi.fn()])

  const screen = await render(
    <Additionals
      ydoc={mockYdoc}
      basePath='root.links[0].data.articles[0]'
      layout={mockLayout}
    />
  )

  await screen.getByRole('checkbox', { name: 'Feature 1' }).click()

  expect(mockSetAdditionals).toHaveBeenCalledWith([
    expect.objectContaining({ name: 'Feature 1', value: 'true' }),
    expect.objectContaining({ name: 'Feature 2', value: 'false' })
  ])
  await matchScreenshot(document.body)
})

test('shows loader when layout is not provided', async () => {
  vi.mocked(useYValue)
    .mockReturnValueOnce([undefined, vi.fn()])
    .mockReturnValueOnce(['test-slot', vi.fn()])

  const screen = await render(
    <Additionals
      ydoc={mockYdoc}
      basePath='root.links[0].data.articles[0]'
      layout={undefined}
    />
  )

  // Loader renders an SVG with animate-spin class — no checkbox should be present
  expect(screen.container.querySelector('.animate-spin')).toBeTruthy()
  await matchScreenshot(document.body)
})
