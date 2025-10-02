import type { ViewMetadata } from '@/types/index'


const meta: ViewMetadata = {
  name: 'ConceptAdmin',
  path: `${import.meta.env.BASE_URL}/conceptAdmin`,
  widths: {
    sm: 12,
    md: 12,
    lg: 6,
    xl: 6,
    '2xl': 6,
    hd: 6,
    fhd: 4,
    qhd: 3,
    uhd: 2
  }
}

export const ConceptAdmin = () => {
  return (
    <>
      <h1>Concept admin</h1>
    </>
  )
}

ConceptAdmin.meta = meta
