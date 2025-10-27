/** Section structure in indexedDB objectStore  */
export interface IDBConcept {
  id: string
  title: string
  usableVersion?: bigint
}

export interface IDBSection extends IDBConcept {
  id: string
  title: string
}

/** Section structure in indexedDB objectStore  */
export interface IDBEditorialInfoType {
  id: string
  title: string
}

/** Story structure in indexedDB objectStore  */
export interface IDBStory extends IDBConcept {
  id: string
  title: string
  shortText: string
  longText: string
}

/** Author structure in indexedDB objectStore */
export interface IDBAuthor {
  id: string
  name: string
  firstName: string
  lastName: string
  initials?: string
  email: string
  sub: string
}

/** Category structure in indexedDB objectStore */
export interface IDBCategory extends IDBConcept {
  id: string
  title: string
}

/** Organiser structure in indexedDB objectStore */
export interface IDBOrganiser {
  id: string
  title: string
  city: string
  country: string
  email: string
  phone: string
  streetAddress: string
}

/** Category structure in indexedDB objectStore */
export interface IDBWireSource {
  uri: string
  title: string
}

export interface IDBContentSource {
  uri: string
  title: string
}

export interface IDBLanguage {
  id: string
}

export interface SupportedLanguage {
  code: string
}
