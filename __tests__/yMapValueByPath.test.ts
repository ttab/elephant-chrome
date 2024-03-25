import { get, set } from '../src/lib/yMapValueByPath'
import * as Y from 'yjs'
import { planning } from './data/planning-repo'
import { newsDocToYPlanning } from '../src-srv/utils/transformations/yjs/yPlanning'
import { toYMap } from '../src-srv/utils/transformations/lib/toYMap'

describe('yMapValueByPath', () => {
  it('get value from object', () => {
    const ydoc = new Y.Doc()

    const root = ydoc.getMap('root')
    const nestedYmap = new Y.Map()
    nestedYmap.set('key', 'value')

    root.set('nested', nestedYmap)
    expect(root instanceof Y.Map).toBeTruthy()

    const result = get(root, 'nested.key')

    expect(result).toBe('value')
  })


  it('gets value from array', () => {
    /*
     * {
     *   nested: {
     *     arr: [
     *       {
     *         first: '1',
     *       },
     *       {
     *         second: '2'
     *       }
     *     ],
     *     key: 'value'
     *   }
     * }
     */
    const ydoc = new Y.Doc()

    const root = ydoc.getMap('root')
    const nestedYmap = new Y.Map()

    const array = new Y.Array()
    const arrayMap = new Y.Map()
    arrayMap.set('first', '1')


    const secondArrayMap = new Y.Map()
    secondArrayMap.set('second', '2')

    array.push([arrayMap])
    array.push([secondArrayMap])

    nestedYmap.set('key', 'value')
    nestedYmap.set('arr', array)

    root.set('nested', nestedYmap)

    expect(root instanceof Y.Map).toBeTruthy()
    expect(get(root, 'nested.arr[0].first')).toBe('1')
    expect(get(root, 'nested.arr[1].second')).toBe('2')
  })

  it('sets simple value', () => {
    const ydoc = new Y.Doc()
    const root = ydoc.getMap('root')

    const result = get(root, 'nested.key')

    expect(result).toBe(undefined)

    set(root, 'nested.key', 'value')

    expect(get(root, 'nested.key')).toBe('value')
  })

  it('sets value in array', () => {
    const { document } = planning

    const yDoc = new Y.Doc()
    const planningYMap = yDoc.getMap('planning')
    if (!document) {
      throw new Error('no document')
    }
    const yPlanning = newsDocToYPlanning(document, planningYMap)
    // eslint-disable-next-line
    yDoc.share.set('planning', yPlanning as unknown as Y.AbstractType<Y.YEvent<any>>)

    const p = yDoc.getMap('planning')

    const payload = {
      uuid: 'f1508161-1b84-5da0-a457-7658c03a2386',
      uri: 'iptc://mediatopic/20001065',
      type: 'core/category',
      title: 'Fotboll',
      rel: 'category'
    }

    const yLinks = get(p, 'links')

    if (!yLinks) {
      throw new Error('Unable to get Y.Map links')
    }

    set(yLinks, 'core/category[0]', toYMap(payload))
    set(yLinks, 'core/category[0].title', 'test')
    expect(get(yLinks, 'core/category[0].title')).toBe('test')
  })

  it('sets ymap in array when no path exists', () => {
    const ydoc = new Y.Doc()
    const root = ydoc.getMap('root')
    const result = get(root, 'nested.arr[1].first')
    expect(result).toBe(undefined)
    set(root, 'nested.arr[0]', toYMap({ index: '0' }))
    set(root, 'nested.arr[2]', toYMap({ index: '2' }))
    set(root, 'nested.arr[1]', toYMap({ index: '1' }))
    set(root, 'nested.arr[8]', toYMap({ index: '8' }))
    expect(root.toJSON()).toEqual({
      nested: {
        arr: [
          { index: '0' },
          { index: '1' },
          { index: '2' },
          {},
          {},
          {},
          {},
          {},
          { index: '8' }
        ]
      }
    })
  })
})
