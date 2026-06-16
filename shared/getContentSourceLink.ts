import { Block } from '@ttab/elephant-api/newsdoc'

const NPK_UNIT = '/redaktionen-npk'
const ORG_NTB = 'core://org/ntb'
const ORG_TT = 'core://org/tt'

/**
 * Derives the default `core/content-source` link for a new document from the
 * session's `org` claim and `units`. NPK is keyed on the unit membership
 * (matches `buildAcl()` in `shared/Repository.ts`).
 *
 * Returns `undefined` when neither claim identifies a known source — callers
 * can then decide whether to omit the link or fall back to something else.
 */
export function getContentSourceLink({
  org,
  units
}: {
  org?: string
  units?: string[]
}): Block | undefined {
  if (units?.includes(NPK_UNIT)) {
    return buildSource('npk', 'NPK')
  }

  if (org === ORG_NTB) {
    return buildSource('ntb', 'NTB')
  }

  if (org === ORG_TT) {
    return buildSource('tt', 'TT')
  }

  return undefined
}

function buildSource(slug: string, title: string): Block {
  return Block.create({
    type: 'core/content-source',
    rel: 'source',
    uri: `tt://content-source/${slug}`,
    title
  })
}
