import type { Block } from '@ttab/elephant-api/newsdoc'

/** Section structure in indexedDB objectStore  */
export interface IDBSection {
  id: string
  title: string
}

/** Section structure in indexedDB objectStore  */
export interface IDBEditorialInfoType {
  id: string
  title: string
}

/** Story structure in indexedDB objectStore  */
export interface IDBStory {
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
export interface IDBCategory {
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

export type TwoOnTwoData = {
  deliverableId: string
  text: string
  payload: {
    title: string | undefined
    meta: {
      'core/newsvalue': Block[]
      'tt/slugline': Block[]
    }
    links: {
      'core/section': Block[]
    }
  }
}
