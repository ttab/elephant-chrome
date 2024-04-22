import { Newsvalues } from './newsvalues'

// Convert Newsvalues to a simple object map for faster access
export const NewsvalueMap = Object.fromEntries(
  Newsvalues.map(item => [item.value, { ...item }])
)
