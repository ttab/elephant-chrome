/** Concept structure in indexedDB objectStore  */
export interface IDBConcept {
  id: string
  title: string
  usableVersion: bigint
}

export interface IDBSection extends IDBConcept {
  code: string
}

/** Section structure in indexedDB objectStore  */
export interface IDBEditorialInfoType extends IDBConcept {
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
export interface IDBAuthor extends IDBConcept {
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
export interface IDBOrganiser extends IDBConcept {
  city: string
  country: string
  email: string
  phone: string
  streetAddress: string
}

/** Category structure in indexedDB objectStore */
export interface IDBWireSource extends IDBConcept {
  uri: string
  title: string
}

export interface IDBContentSource extends IDBConcept {
  uri: string
  title: string
}

export interface IDBLanguage {
  id: string
}

export interface SupportedLanguage {
  code: string
}
