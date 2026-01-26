/**
 * Temporary utils to work with wires state
 *
 * Example state:
 * {
 *   "title": "Utrikesbevakning",
 *   "type": "tt/wires-panes",
 *   "content": [
 *     {
 *       "uuid": "1582b455-681b-496e-8d1e-94ef809f6e5e",
 *       "title": "APA Economy",
 *       "meta": [
 *         {"role": "filter", "type": "core/section", "uuid": "111932dc-99f3-4ba4-acf2-ed9d9f2f1c7c"},
 *         {"role": "filter", "type": "source", "uri": "wires://source/apa"}
 *       ]
 *     },
 *     {
 *       "uuid": "3d2542c0-39ca-4438-9c87-7a3efdb9e7b7",
 *       "title": "NTB",
 *       "meta": [
 *         {"role": "filter", "type": "source", "uri": "wires://source/ntb"}
 *       ]
 *     }
 *   ]
 * }
 *
 */

import type { HistoryState } from '@/navigation/hooks/useHistory'

export interface WireStreamFilter {
  role: 'filter'
  type: string
  uuid?: string
  uri?: string
  value?: string
}

export interface WireStream {
  uuid: string
  title?: string
  meta: WireStreamFilter[]
}

export interface WireState {
  title: string
  type: 'tt/wires-panes'
  content: WireStream[]
}

/**
 * Create a new WireState with a new additional entry
 * @param {WireState} state - Full wire state
 * @returns {WireState}
 */
export function addWire(state: WireState): WireState {
  const newState = {
    title: state.title,
    type: state.type,
    content: state.content.map((item) => { return { ...item } })
  }

  newState.content.push({
    uuid: crypto.randomUUID(),
    meta: []
  })

  return newState
}

/**
 * Create a new WireState without given wire stream identified by uuid
 * @param {WireState} state - Full wire state
 * @param {string} uuid - Id of the wire stream to remove
 * @returns {WireState}
 */
export function removeWire(state: WireState, uuid: string): WireState {
  const newState = {
    title: state.title,
    type: state.type,
    content: state.content
      .filter((item) => item.uuid !== uuid)
      .map((item) => { return { ...item } })
  }

  return newState
}

/**
 * Convert a stream filer into query params
 * @todo Investigate:
 * Should the constructQuery() in src/hooks/index/useDocuments/queries/views/wires.ts
 * take a stream filter array as param instead?
 *
 * @param {WireStream} stream
 * @returns {Record<string, string | string[] | undefined>}
 */
export function getWireFilter(stream: WireStream): Record<string, string | string[] | undefined> {
  const params = {} as Record<string, string | string[]>

  for (const filter of stream.meta) {
    if (filter.role !== 'filter') {
      continue
    }

    if (filter.type === 'tt/source' && filter.uri) {
      params['source'] = Array.isArray(params['source'])
        ? [...params['source'], filter.uri]
        : [filter.uri]
    }

    if (filter.type === 'query' && filter.value) {
      params['query'] = filter.value
    }

    if (filter.type === 'core/section' && filter.uuid) {
      params['section'] = Array.isArray(params['section'])
        ? [...params['section'], filter.uuid]
        : [filter.uuid]
    }

    if (filter.type === 'tt/newsvalue' && filter.value) {
      params['newsvalue'] = Array.isArray(params['newsvalue'])
        ? [...params['newsvalue'], filter.value]
        : [filter.value]
    }
  }

  return params
}

/**
 * Initialize the state with either old history state data or use existing new state
 *
 * @param {HistoryState} historyState - Existing history state
 * @param {WireState} wireState - Existing wire state in new format
 * @returns {WireState}
 */
export function init(historyState?: HistoryState, wireState?: WireState): WireState {
  if (wireState) {
    return wireState
  }

  const defaultState: WireState = {
    title: 'Default',
    type: 'tt/wires-panes',
    content: [{
      uuid: crypto.randomUUID(),
      meta: []
    }]
  }

  // Check if historyState has relevant data
  if (!historyState?.contentState || !Array.isArray(historyState.contentState) || historyState.contentState.length === 0) {
    return defaultState
  }

  // Transform contentState items into WireStream items
  const content: WireStream[] = historyState.contentState
    .filter((item) => item.name === 'Wires' && item.props) // Only process Wires views with props
    .map((item) => {
      const meta: WireStreamFilter[] = []

      // Add source filter if present
      if (item.props?.source) {
        meta.push({
          role: 'filter',
          type: 'tt/source',
          uri: item.props.source
        })
      }

      // Add section filter if present
      // @ts-expect-error Temporary code
      const section = item.props?.section as unknown as string | undefined
      if (section) {
        meta.push({
          role: 'filter',
          type: 'core/section',
          uuid: section
        })
      }

      // Add newsvalue filter if present
      // @ts-expect-error Temporary code
      const newsvalue = item.props?.newsvalue as unknown as string | undefined
      if (newsvalue) {
        meta.push({
          role: 'filter',
          type: 'tt/newsvalue',
          value: newsvalue
        })
      }

      // Add newsvalue filter if present
      // @ts-expect-error Temporary code
      const query = item.props?.query as unknown as string | undefined
      if (query) {
        meta.push({
          role: 'filter',
          type: 'query',
          value: query
        })
      }

      return {
        uuid: item.viewId,
        meta
      }
    })

  // If no valid content was transformed, return default
  if (content.length === 0) {
    return defaultState
  }

  return {
    title: 'Default',
    type: 'tt/wires-panes',
    content
  }
}
