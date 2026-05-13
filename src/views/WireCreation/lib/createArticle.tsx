import type { Session } from 'next-auth'
import { getValueByYPath } from '@/shared/yUtils'
import { Block } from '@ttab/elephant-api/newsdoc'
import type { Wire } from '@/shared/schemas/wire'
import type { EleBlock } from '@/shared/types'
import { toast } from 'sonner'
import { ToastAction } from '@/components/ToastAction'
import { CalendarDaysIcon, FileInputIcon } from '@ttab/elephant-ui/icons'
import { addAssignmentWithDeliverable } from '@/lib/index/addAssignment'
import { convertToISOStringInTimeZone } from '@/shared/datetime'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
import i18n from '@/lib/i18n'
import type { TBElement } from '@ttab/textbit'
import { translateWireContent } from './translateWireContent'
import * as Templates from '@/shared/templates'
import { slateToNewsDoc } from '@/shared/transformations/newsdoc'
import { getContentSourceLink } from '@/shared/getContentSourceLink'
import type { Repository } from '@/shared/Repository'

/**
 * Build the wire-source `tt/wire` link blocks for the article.
 */
function buildWireLinks(wires?: Wire[]): Block[] {
  if (!wires?.length) return []
  return wires.map((wire) => Block.create({
    type: 'tt/wire',
    uuid: wire.id,
    title: wire.fields['document.title']?.values?.[0],
    rel: 'source-document',
    data: {
      version: wire.fields['current_version']?.values?.[0]
    }
  }))
}

/**
 * Merge the session-derived default content-source with wire-provided
 * content-sources. De-duplicate by URI so the session default is kept when
 * the wire carries the same source.
 */
function buildContentSources(
  session: Session,
  contentSources: EleBlock[] | undefined
): Block[] {
  const merged: Block[] = []
  const seen = new Set<string>()

  const sessionSource = getContentSourceLink({ org: session.org, units: session.units })
  if (sessionSource) {
    merged.push(sessionSource)
    seen.add(sessionSource.uri)
  }

  if (contentSources) {
    for (const source of contentSources) {
      if (!seen.has(source.uri)) {
        merged.push(Block.create({
          type: 'core/content-source',
          uri: source.uri,
          title: source.title,
          rel: source.rel || 'source'
        }))
        seen.add(source.uri)
      }
    }
  }

  return merged
}

export async function createArticle({
  ydoc,
  articleId,
  repository,
  status,
  session,
  wires,
  planningId,
  planningTitle,
  newsvalue,
  section,
  timeZone,
  embargoUntil,
  contentSources,
  wireContent,
  translationMode,
  personalPrefs,
  ntbUrl
}: {
  /** Form Y.Doc; only used to read user edits to title/slugline/newsvalue. */
  ydoc: YDocument<Y.Map<unknown>>
  /** The article's UUID. Must NOT have been opened in Hocuspocus during the dialog. */
  articleId: string
  repository: Repository | undefined
  status: string
  session: Session
  wires?: Wire[]
  planningId?: string
  planningTitle?: string
  newsvalue?: string
  section: {
    uuid: string
    title: string
  }
  timeZone: string
  embargoUntil?: string
  contentSources?: EleBlock[]
  wireContent?: TBElement[]
  translationMode?: 'standard' | 'personal'
  personalPrefs?: string
  /** Translation service URL. Required when `translationMode` is set. */
  ntbUrl?: string
}): Promise<void> {
  if (status !== 'authenticated' || !repository) {
    console.error('Failed adding new wire article: not authenticated or no repository')
    toast.error(i18n.t('wires:creation.createError2'))
    return
  }

  // Read user-edited form fields from the form Y.Doc. These are synced via
  // the existing Yjs-bound form components in the dialog.
  const [assignmentTitle] = getValueByYPath<string>(ydoc.ele, 'root.title')
  const [assignmentSlugline] = getValueByYPath<string>(ydoc.ele, 'meta.tt/slugline[0].value')
  const [ydocNewsValue] = getValueByYPath<string>(ydoc.ele, 'meta.core/newsvalue[0].value')
  const resolvedNewsValue = newsvalue ?? ydocNewsValue

  const dt = new Date()
  const isoDateTime = `${new Date().toISOString().split('.')[0]}Z` // Remove ms, add Z back again
  const localDate = convertToISOStringInTimeZone(dt, timeZone).slice(0, 10)

  // Translate before any persistence so the saved document always carries the
  // final content. On failure, fall back to the original wire content.
  let articleContent: TBElement[] | undefined
  if (wireContent && translationMode) {
    try {
      if (!ntbUrl) {
        throw new Error('Translation service is not configured for this deployment')
      }
      articleContent = await translateWireContent(wireContent, translationMode, {
        ntbUrl,
        accessToken: session.accessToken,
        personalPrefs
      })
    } catch (ex) {
      console.error('Translation failed, using original wire content', ex)
      toast.error(i18n.t('wires:creation.translationError'))
      articleContent = wireContent
    }
  }

  // Save the article to the repository FIRST, before any planning update
  // exposes its UUID to other readers. If the planning is updated first,
  // anything that opens the article in that window (the user clicking
  // through, a planning preview, etc.) hits an empty Hocuspocus load —
  // which can then get cached as the doc's state. Matches the order in
  // submitTimeless.ts.
  const document = Templates.article(articleId, {
    title: assignmentTitle,
    meta: {
      ...(assignmentSlugline
        ? { 'tt/slugline': [Block.create({ type: 'tt/slugline', value: assignmentSlugline })] }
        : {}),
      ...(resolvedNewsValue
        ? { 'core/newsvalue': [Block.create({ type: 'core/newsvalue', value: resolvedNewsValue })] }
        : {})
    },
    links: {
      'core/section': [Block.create({
        type: 'core/section',
        rel: 'section',
        uuid: section.uuid,
        title: section.title
      })],
      ...(wires?.length ? { 'tt/wire': buildWireLinks(wires) } : {}),
      ...(() => {
        const sources = buildContentSources(session, contentSources)
        return sources.length ? { 'core/content-source': sources } : {}
      })()
    }
  })

  // Replace the template's default empty content with the translated wire
  // body when translation is in play. Without translation, the article keeps
  // the template's default empty content (user authors the article from
  // scratch in the Editor).
  if (articleContent !== undefined) {
    document.content = slateToNewsDoc(articleContent) || []
  }

  await repository.saveDocument(document, session.accessToken, 'draft')

  // Link the (now-persisted) article into the planning as an assignment.
  // If this fails the article is orphaned in the repository, same as the
  // existing timeless flow. The caller surfaces the error toast.
  const updatedPlanningId = await addAssignmentWithDeliverable({
    planningId,
    planningTitle,
    type: 'text',
    deliverableId: articleId,
    title: assignmentTitle || '',
    slugline: assignmentSlugline,
    priority: resolvedNewsValue ? parseInt(resolvedNewsValue) : undefined,
    publicVisibility: false,
    localDate,
    isoDateTime,
    section,
    wires,
    embargoUntil
  })

  if (!updatedPlanningId) {
    throw new Error('CreateAssignmentError')
  }

  toast.success(i18n.t('wires:creation.articleCreated'), {
    duration: 8000,
    classNames: {
      title: 'whitespace-nowrap'
    },
    action: (
      <div className='flex w-full gap-1 justify-end [&>*]:w-auto'>
        <ToastAction
          documentId={updatedPlanningId}
          withView='Planning'
          Icon={CalendarDaysIcon}
          label={i18n.t('wires:toast.openPlanning')}
          target='last'
        />
        <ToastAction
          documentId={articleId}
          planningId={updatedPlanningId}
          withView='Editor'
          Icon={FileInputIcon}
          label={i18n.t('wires:toast.openArticle')}
          target='last'
        />
      </div>
    )
  })
}
