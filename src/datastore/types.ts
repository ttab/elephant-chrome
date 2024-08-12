/** Story structure in indexedDB objectStore  */
export interface IDBStory {
  id: string
  title: string
  shortText: string
  longText: string
}

/** Story structure in indexedDB objectStore */
export interface IDBAuthor {
  id: string
  title: string
  firstName: string
  lastName: string
  initials: string
  email: string
}
