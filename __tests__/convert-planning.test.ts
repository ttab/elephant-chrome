import { newsDocToYMap, yMapToNewsDoc } from '../src-srv/utils/transformations/yjs/yMap'

import * as Y from 'yjs'

import { planning as pl } from './data/planning-repo'

describe('Conversion of newsdoc to yMap document', () => {
  const { document } = pl
  const yDoc = new Y.Doc()
  const yMap = yDoc.getMap('ele')

  if (!document) {
    throw new Error('no document')
  }

  const yPlanning = newsDocToYMap(document, yMap)

  it('transforms newsDoc to yPlanning', () => {
    const planningJson = yDoc.getMap('ele').toJSON()
    expect(planningJson).toMatchSnapshot()
  })

  it('transforms yPlanning to newsDoc', () => {
    const newsDoc = yMapToNewsDoc(yPlanning)
    expect(newsDoc).toMatchSnapshot()
  })
})
