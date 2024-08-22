/** Story structure in indexedDB objectStore  */
export interface IDBSection {
  id: string
  title: string
}
export interface IDBStory {
  id: string
  title: string
  shortText: string
  longText: string
}

/** Author structure in indexedDB objectStore */
export interface IDBAuthor {
  id: string
  title: string
  firstName: string
  lastName: string
  initials: string
  email: string
}

/** Category structure in indexedDB objectStore */
export interface IDBCategory {
  id: string
  title: string
}

/** Organisation structure in indexedDB objectStore */
export interface IDBOrganisation {
  title: string
  city: string
  country: string
  email: string
  phone: string
  streetAddress: string
}
