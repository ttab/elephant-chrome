import * as Y from 'yjs'
import { type GetDocumentResponse } from '@ttab/elephant-api/repository'
import { Block } from '@ttab/elephant-api/newsdoc'
import { toYMap } from '../lib/toYMap.js'
import { group, ungroup } from '../lib/group.js'
import { newsDocToSlate, slateToNewsDoc } from '../newsdoc/index.js'
import { slateNodesToInsertDelta, yTextToSlateElement } from '@slate-yjs/core'
import { type TBElement } from '@ttab/textbit'
import { type Document } from '@hocuspocus/server'
import createHash from '../../../../shared/createHash.js'

async function yContentToNewsDoc(yContent: Y.XmlText): Promise<Block[] | undefined> {
  const slateElement = yTextToSlateElement(yContent).children
  return await slateToNewsDoc(slateElement as TBElement[])
}

function assertSlugline(yMeta: Y.Map<unknown>, documentType: string): void {
  // Only perform on planning items and assignments
  if (!['core/planning-item', 'core/assignment'].includes(documentType)) {
    return
  }

  const payload: Block = Block.create({
    type: 'tt/slugline'
  })

  const ySlugline = yMeta.get('tt/slugline') as Y.Map<unknown>

  if (!ySlugline) {
    const yArr = new Y.Array()

    yArr.push([toYMap({ ...payload }, new Y.Map())])
    yMeta.set('tt/slugline', yArr)
  }
}

function assertDescriptions(yMeta: Y.Map<unknown>, documentType: string): void {
  // Only perform on planning items and assignments
  if (!['core/planning-item', 'core/assignment'].includes(documentType)) {
    return
  }

  const yDesc = yMeta.get('core/description') as Y.Array<Y.Map<unknown>>

  const payload: Block = Block.create({
    type: 'core/description',
    data: { text: '' }
  })

  // No descriptions
  if (!yDesc) {
    const yArr = new Y.Array()
    yArr.push([toYMap({ ...payload, role: 'public' }, new Y.Map())])
    yArr.push([toYMap({ ...payload, role: 'internal' }, new Y.Map())])

    yMeta.set('core/description', yArr)
    return
  }

  // Already has two descriptions
  if (yDesc.length === 2) {
    return
  }

  // Find missing description
  const descriptionTypes = yDesc.map((yMap) => yMap.get('role') as string)
  const missingType = ['public', 'internal'].filter((role) => !descriptionTypes.includes(role))

  missingType.forEach((role) => {
    yDesc.push([toYMap({ ...payload, role }, new Y.Map())])
  })
}

export function newsDocToYDoc(yDoc: Document | Y.Doc, newsDoc: GetDocumentResponse): void {
  const yMap = yDoc.getMap('ele')
  const { document, version } = newsDoc

  if (document) {
    const { meta, links, content, ...rest } = document

    yMap.set('meta', toYMap(group(document.meta || [], 'type'), new Y.Map()))
    yMap.set('links', toYMap(group(document.links || [], 'type'), new Y.Map()))
    yMap.set('root', toYMap(rest, new Y.Map()))

    assertDescriptions(yMap.get('meta') as Y.Map<unknown>, document.type)
    assertSlugline(yMap.get('meta') as Y.Map<unknown>, document.type)


    // Assert assignment descriptions
    const yMeta = yMap.get('meta') as Y.Map<unknown>
    const yAssignments = yMeta.get('core/assignment') as Y.Array<unknown>
    if (yAssignments?.length) {
      for (const yAssignment of yAssignments) {
        const assMeta = (yAssignment as Y.Map<unknown>).get('meta') as Y.Map<unknown>
        assertDescriptions(assMeta, 'core/assignment')
        assertSlugline(assMeta, 'core/assignment')
      }
    }

    // Share editable content for Textbit use
    const yContent = new Y.XmlText()
    const slateDocument = newsDocToSlate(document?.content ?? [])
    yContent.applyDelta(
      slateNodesToInsertDelta(slateDocument)
    )
    yMap.set('content', yContent)

    // Set version
    const yVersion = yDoc.getMap('version')
    yVersion?.set('version', version?.toString())

    const originalHash = createHash(JSON.stringify(newsDoc.document))

    const yOriginalHash = yDoc.getMap('hash')
    yOriginalHash?.set('hash', originalHash)

    return
  }

  throw new Error('No document')
}

export async function yDocToNewsDoc(yDoc: Y.Doc): Promise<GetDocumentResponse> {
  const yMap = yDoc.getMap('ele')
  try {
    const meta = ungroup((yMap.get('meta') as Y.Map<unknown>)?.toJSON() || {})
    const links = ungroup((yMap.get('links') as Y.Map<unknown>)?.toJSON() || {})

    const yContent = yMap.get('content') as Y.XmlText | undefined
    const content = yContent?.toString() ? await yContentToNewsDoc(yContent) : []


    const root = yMap.get('root') as Y.Map<unknown> | undefined

    const { uuid, type, uri, url, title, language } = root?.toJSON() || {}

    meta.forEach(docMeta => {
      if (docMeta.type === 'core/assignment') {
        docMeta.meta = docMeta.meta.filter(assMeta => {
          if (assMeta.type === 'core/description') {
            return assMeta.data.text !== ''
          }

          if (assMeta.type === 'tt/slugline') {
            return assMeta.value !== ''
          }

          return true
        })
      }
    })

    const version = yDoc.getMap('version').get('version') as string
    return {
      version: version ? BigInt(version) : 0n,
      isMetaDocument: false,
      mainDocument: '',
      document: {
        uuid,
        type,
        uri,
        url,
        title,
        content: content || [],
        // Remove added empty descriptions
        meta: meta.filter((m) => {
          if (m.type === 'core/description') {
            return m.data.text !== ''
          }
          return true
        }),
        links,
        language
      }
    }
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(err.message)
    }
    throw new Error('Unknown error')
  }
}
