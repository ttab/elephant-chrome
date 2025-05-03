import plannings from './plannings'
import events from './events'
import articles from './articles'

const search = {
  plannings,
  events,
  articles
}
export type SearchKeys = keyof typeof search
export default search

