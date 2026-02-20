import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import React from 'react'
import type { Cell, Row as RowType } from '@tanstack/react-table'
import type * as ReactTable from '@tanstack/react-table'
import { makeWire, makeFlashWire } from '../../data/tableMocks'
import type { Wire } from '@/shared/schemas/wire'

vi.mock('@ttab/elephant-ui', () => ({
  TableRow: ({ children, ...props }: React.HTMLProps<HTMLTableRowElement>) => (
    <tr data-testid='wire-table-row' {...props}>{children}</tr>
  ),
  TableCell: ({ children, ...props }: React.HTMLProps<HTMLTableCellElement>) => (
    <td {...props}>{children}</td>
  )
}))

vi.mock('@tanstack/react-table', async (importOriginal) => {
  const original = await importOriginal<typeof ReactTable>()
  return {
    ...original,
    flexRender: vi.fn(() => <span data-testid='cell-content' />)
  }
})

import { WireRow } from '@/components/Table/WireRow'

function makeWireRow(wire: Wire, overrides: Partial<RowType<Wire>> = {}): RowType<Wire> {
  return {
    id: 'wire-row-0',
    original: wire,
    getIsSelected: vi.fn(() => false),
    toggleSelected: vi.fn(),
    getVisibleCells: vi.fn(() => [] as Cell<Wire, unknown>[]),
    subRows: [],
    ...overrides
  } as unknown as RowType<Wire>
}

describe('WireRow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('data-state attribute', () => {
    it('is "selected" when wire.id is in openDocuments', () => {
      const wire = makeWire()
      const row = makeWireRow(wire)
      render(
        <table>
          <tbody>
            <WireRow row={row} handleOpen={vi.fn()} openDocuments={['wire-001']} />
          </tbody>
        </table>
      )
      const tr = screen.getByTestId('wire-table-row')
      expect(tr).toHaveAttribute('data-state', 'selected')
    })

    it('is "focused" when row.getIsSelected() is true and not in openDocuments', () => {
      const wire = makeWire()
      const row = makeWireRow(wire, { getIsSelected: vi.fn(() => true) })
      render(
        <table>
          <tbody>
            <WireRow row={row} handleOpen={vi.fn()} openDocuments={[]} />
          </tbody>
        </table>
      )
      const tr = screen.getByTestId('wire-table-row')
      expect(tr).toHaveAttribute('data-state', 'focused')
    })

    it('is undefined when neither condition is true', () => {
      const wire = makeWire()
      const row = makeWireRow(wire, { getIsSelected: vi.fn(() => false) })
      render(
        <table>
          <tbody>
            <WireRow row={row} handleOpen={vi.fn()} openDocuments={[]} />
          </tbody>
        </table>
      )
      const tr = screen.getByTestId('wire-table-row')
      expect(tr).not.toHaveAttribute('data-state')
    })

    it('"selected" takes precedence over "focused" when both true', () => {
      const wire = makeWire()
      const row = makeWireRow(wire, { getIsSelected: vi.fn(() => true) })
      render(
        <table>
          <tbody>
            <WireRow row={row} handleOpen={vi.fn()} openDocuments={['wire-001']} />
          </tbody>
        </table>
      )
      const tr = screen.getByTestId('wire-table-row')
      expect(tr).toHaveAttribute('data-state', 'selected')
    })
  })

  describe('auto-focus via ref', () => {
    it('focuses the element when row.getIsSelected() is true', () => {
      const wire = makeWire()
      const row = makeWireRow(wire, { getIsSelected: vi.fn(() => true) })
      render(
        <table>
          <tbody>
            <WireRow row={row} handleOpen={vi.fn()} openDocuments={[]} />
          </tbody>
        </table>
      )
      const tr = screen.getByTestId('wire-table-row')
      expect(document.activeElement).toBe(tr)
    })

    it('does not focus when row.getIsSelected() is false', () => {
      const wire = makeWire()
      const row = makeWireRow(wire, { getIsSelected: vi.fn(() => false) })
      render(
        <table>
          <tbody>
            <WireRow row={row} handleOpen={vi.fn()} openDocuments={[]} />
          </tbody>
        </table>
      )
      const tr = screen.getByTestId('wire-table-row')
      expect(document.activeElement).not.toBe(tr)
    })
  })

  describe('flash styling', () => {
    it('applies text-red-500 class when heads.flash.version has a value', () => {
      const wire = makeFlashWire()
      const row = makeWireRow(wire)
      render(
        <table>
          <tbody>
            <WireRow row={row} handleOpen={vi.fn()} openDocuments={[]} />
          </tbody>
        </table>
      )
      const tr = screen.getByTestId('wire-table-row')
      expect(tr.className).toContain('text-red-500')
    })

    it('applies text-red-500 class when newsvalue is "6"', () => {
      const wire = makeWire({
        'document.meta.core_newsvalue.value': { values: ['6'] },
        'heads.flash.version': { values: [] }
      })
      const row = makeWireRow(wire)
      render(
        <table>
          <tbody>
            <WireRow row={row} handleOpen={vi.fn()} openDocuments={[]} />
          </tbody>
        </table>
      )
      const tr = screen.getByTestId('wire-table-row')
      expect(tr.className).toContain('text-red-500')
    })

    it('does not apply red class for non-flash draft', () => {
      const wire = makeWire({
        'document.meta.core_newsvalue.value': { values: ['3'] },
        'heads.flash.version': { values: [] }
      })
      const row = makeWireRow(wire)
      render(
        <table>
          <tbody>
            <WireRow row={row} handleOpen={vi.fn()} openDocuments={[]} />
          </tbody>
        </table>
      )
      const tr = screen.getByTestId('wire-table-row')
      expect(tr.className).not.toContain('text-red-500')
    })
  })

  describe('draft status className', () => {
    it('contains border-s-[6px] and bg-background for draft status', () => {
      const wire = makeWire() // version 3, no valid heads -> draft
      const row = makeWireRow(wire)
      render(
        <table>
          <tbody>
            <WireRow row={row} handleOpen={vi.fn()} openDocuments={[]} />
          </tbody>
        </table>
      )
      const tr = screen.getByTestId('wire-table-row')
      expect(tr.className).toContain('border-s-[6px]')
      expect(tr.className).toContain('bg-background')
    })

    it('draft+flash contains border-s-red-500', () => {
      const wire = makeFlashWire()
      const row = makeWireRow(wire)
      render(
        <table>
          <tbody>
            <WireRow row={row} handleOpen={vi.fn()} openDocuments={[]} />
          </tbody>
        </table>
      )
      const tr = screen.getByTestId('wire-table-row')
      expect(tr.className).toContain('border-s-red-500')
    })
  })

  describe('read/saved/used status className — isUpdated=false', () => {
    // For "not updated", ALL head versions must equal current_version (no lower versions)
    // so isUpdated() returns false. We set heads we don't care about to '' (parses to NaN -> skipped).

    it('contains bg-approved-background for read status when not updated', () => {
      const wire = makeWire({
        current_version: { values: ['2'] },
        'heads.read.version': { values: ['2'] },
        'heads.read.created': { values: ['2025-01-01T10:00:00Z'] },
        'heads.saved.version': { values: [''] },
        'heads.saved.created': { values: [''] },
        'heads.used.version': { values: [''] },
        'heads.used.created': { values: [''] }
      })
      const row = makeWireRow(wire)
      render(
        <table>
          <tbody>
            <WireRow row={row} handleOpen={vi.fn()} openDocuments={[]} />
          </tbody>
        </table>
      )
      const tr = screen.getByTestId('wire-table-row')
      expect(tr.className).toContain('bg-approved-background')
    })

    it('contains bg-done-background for saved status when not updated', () => {
      const wire = makeWire({
        current_version: { values: ['2'] },
        'heads.saved.version': { values: ['2'] },
        'heads.saved.created': { values: ['2025-01-01T10:00:00Z'] },
        'heads.read.version': { values: [''] },
        'heads.read.created': { values: [''] },
        'heads.used.version': { values: [''] },
        'heads.used.created': { values: [''] }
      })
      const row = makeWireRow(wire)
      render(
        <table>
          <tbody>
            <WireRow row={row} handleOpen={vi.fn()} openDocuments={[]} />
          </tbody>
        </table>
      )
      const tr = screen.getByTestId('wire-table-row')
      expect(tr.className).toContain('bg-done-background')
    })

    it('contains bg-usable-background for used status when not updated', () => {
      const wire = makeWire({
        current_version: { values: ['2'] },
        'heads.used.version': { values: ['2'] },
        'heads.used.created': { values: ['2025-01-01T10:00:00Z'] },
        'heads.read.version': { values: [''] },
        'heads.read.created': { values: [''] },
        'heads.saved.version': { values: [''] },
        'heads.saved.created': { values: [''] }
      })
      const row = makeWireRow(wire)
      render(
        <table>
          <tbody>
            <WireRow row={row} handleOpen={vi.fn()} openDocuments={[]} />
          </tbody>
        </table>
      )
      const tr = screen.getByTestId('wire-table-row')
      expect(tr.className).toContain('bg-usable-background')
    })
  })

  describe('isUpdated logic', () => {
    it('excludes bg-*-background when current_version > head version (updated)', () => {
      // current_version=5, read.version=2 -> updated (5 > 2)
      const wire = makeWire({
        current_version: { values: ['5'] },
        'heads.read.version': { values: ['2'] },
        'heads.read.created': { values: ['2025-01-01T10:00:00Z'] }
      })
      const row = makeWireRow(wire)
      render(
        <table>
          <tbody>
            <WireRow row={row} handleOpen={vi.fn()} openDocuments={[]} />
          </tbody>
        </table>
      )
      const tr = screen.getByTestId('wire-table-row')
      expect(tr.className).not.toContain('bg-approved-background')
    })

    it('still includes border-s-approved even when updated', () => {
      const wire = makeWire({
        current_version: { values: ['5'] },
        'heads.read.version': { values: ['2'] },
        'heads.read.created': { values: ['2025-01-01T10:00:00Z'] }
      })
      const row = makeWireRow(wire)
      render(
        <table>
          <tbody>
            <WireRow row={row} handleOpen={vi.fn()} openDocuments={[]} />
          </tbody>
        </table>
      )
      const tr = screen.getByTestId('wire-table-row')
      expect(tr.className).toContain('border-s-approved')
    })
  })

  describe('click handler', () => {
    it('calls handleOpen with event and row when clicked', () => {
      const handleOpen = vi.fn()
      const wire = makeWire()
      const row = makeWireRow(wire)
      render(
        <table>
          <tbody>
            <WireRow row={row} handleOpen={handleOpen} openDocuments={[]} />
          </tbody>
        </table>
      )
      const tr = screen.getByTestId('wire-table-row')
      fireEvent.click(tr)
      expect(handleOpen).toHaveBeenCalledTimes(1)
      expect(handleOpen).toHaveBeenCalledWith(expect.any(Object), row)
    })
  })
})
