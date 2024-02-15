import { newsDocToYPlanning } from '../src-srv/utils/transformations/yjs/yPlanning'
import * as Y from 'yjs'
import { planning as pl } from './data/planning-repo'

describe('YPlanning', () => {
  test('transform newsDoc to yPlanning', () => {
    const { document } = pl

    const yDoc = new Y.Doc()

    const planningYMap = yDoc.getMap('planning')
    if (!document) {
      throw new Error('no document')
    }
    const yPlanning = newsDocToYPlanning(document, planningYMap)
    // eslint-disable-next-line
    yDoc.share.set('planning', yPlanning as unknown as Y.AbstractType<Y.YEvent<any>>)

    const planningJson = yDoc.getMap('planning').toJSON()
    expect(planningJson).toMatchSnapshot()
  })
})
