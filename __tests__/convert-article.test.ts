import { newsDocToSlate, slateToNewsDoc } from '../src-srv/utils/transformations/newsdoc'
import { article as ar } from './data/article-repo'

describe('Conversion of slate to newsdoc', () => {
  const { document } = ar
  if (!document) {
    throw new Error('No document to transform')
  }

  const slate = newsDocToSlate(document.content)

  it('should convert newsdoc to slate', () => {
      expect(slate).toMatchSnapshot()
  })

  it('should be able to revert slate to newsdoc', () => {
    if (!document) {
      throw new Error('No document to transform')
    }

    const slate = newsDocToSlate(document.content)
    const newsdoc = slateToNewsDoc(slate)
    expect(newsdoc).toEqual(document.content)

  })
})
