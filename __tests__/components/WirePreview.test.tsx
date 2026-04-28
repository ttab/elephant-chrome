import { render, screen } from '@testing-library/react'
import { HitV1 } from '@ttab/elephant-api/index'
import { WirePreview } from '@/components/WirePreview/WirePreview'
import type { Wire } from '@/shared/schemas/wire'

vi.mock('@/components/WirePreview/DocumentHistory', () => ({
  DocumentHistory: () => null
}))

vi.mock('@/components/PlainEditor', () => ({
  Editor: () => null
}))

function buildWire(extraFields: Record<string, { values: string[] }>): Wire {
  const hit = HitV1.create({
    id: 'wire-1',
    fields: {
      'document.meta.tt_wire.role': { values: ['article'] },
      current_version: { values: ['1'] },
      ...extraFields
    }
  })
  return hit as Wire
}

describe('WirePreview', () => {
  it('renders the source and provider title fields', async () => {
    const wire = buildWire({
      'document.rel.source.uri': { values: ['wires://source/raw-slug'] },
      'document.rel.source.title': { values: ['Reuters'] },
      'document.rel.provider.uri': { values: ['wires://provider/raw-provider'] },
      'document.rel.provider.title': { values: ['ReutersPro'] }
    })

    render(<WirePreview wire={wire} />)

    expect(await screen.findByText('Reuters')).toBeInTheDocument()
    expect(screen.getByText('ReutersPro')).toBeInTheDocument()
    expect(screen.queryByText('raw-slug')).not.toBeInTheDocument()
    expect(screen.queryByText('raw-provider')).not.toBeInTheDocument()
  })

  it('falls back to a URI-stripped slug for source when its title is missing', async () => {
    const wire = buildWire({
      'document.rel.source.uri': { values: ['wires://source/tt'] },
      'document.rel.provider.title': { values: ['ReutersPro'] }
    })

    render(<WirePreview wire={wire} />)

    expect(await screen.findByText('tt')).toBeInTheDocument()
    expect(screen.getByText('ReutersPro')).toBeInTheDocument()
  })

  it('falls back to a URI-stripped slug for provider when its title is missing', async () => {
    const wire = buildWire({
      'document.rel.source.title': { values: ['Reuters'] },
      'document.rel.provider.uri': { values: ['wires://provider/tt-pro'] }
    })

    render(<WirePreview wire={wire} />)

    expect(await screen.findByText('Reuters')).toBeInTheDocument()
    expect(screen.getByText('tt-pro')).toBeInTheDocument()
  })

  it('decodes HTML entities in both source and provider badges', async () => {
    const wire = buildWire({
      'document.rel.source.title': { values: ['AFP &amp; Co'] },
      'document.rel.provider.title': { values: ['Reuters &#39;Pro&#39;'] }
    })

    render(<WirePreview wire={wire} />)

    expect(await screen.findByText('AFP & Co')).toBeInTheDocument()
    expect(screen.getByText('Reuters \'Pro\'')).toBeInTheDocument()
    expect(screen.queryByText('AFP &amp; Co')).not.toBeInTheDocument()
    expect(screen.queryByText('Reuters &#39;Pro&#39;')).not.toBeInTheDocument()
  })

  it('hides the provider badge when it matches the source case-insensitively', async () => {
    const wire = buildWire({
      'document.rel.source.title': { values: ['TT'] },
      'document.rel.provider.title': { values: ['tt'] }
    })

    render(<WirePreview wire={wire} />)

    expect(await screen.findByText('TT')).toBeInTheDocument()
    expect(screen.queryByText('tt')).not.toBeInTheDocument()
  })
})
