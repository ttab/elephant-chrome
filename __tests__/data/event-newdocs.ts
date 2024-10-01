import { type GetDocumentResponse } from '@ttab/elephant-api/repository'

export const event: GetDocumentResponse = {
  mainDocument: '',
  isMetaDocument: false,
  version: 1n,
  document: {
    uuid: 'be0e2313-a8d4-4575-9816-8828b8827f10',
    type: 'core/event',
    uri: 'core://event/be0e2313-a8d4-4575-9816-8828b8827f10',
    url: '',
    title: 'Demokraternas konvent i Chicago',
    content: [],
    meta: [
      {
        id: '',
        uuid: '',
        uri: '',
        url: '',
        type: 'core/event',
        title: '',
        data: {
          end: '2024-08-20T21:59:59.999Z',
          start: '2024-08-19T22:00:00.000Z',
          registration: '',
          dateGranularity: 'date'
        },
        rel: '',
        role: '',
        name: '',
        value: '',
        contenttype: '',
        sensitivity: '',
        links: [],
        content: [],
        meta: []
      },
      {
        id: '',
        uuid: '',
        uri: '',
        url: '',
        type: 'core/newsvalue',
        title: '',
        data: {},
        rel: '',
        role: '',
        name: '',
        value: '4',
        contenttype: '',
        sensitivity: '',
        links: [],
        content: [],
        meta: []
      },
      {
        id: '',
        uuid: '',
        uri: '',
        url: '',
        type: 'core/description',
        title: '',
        data: {
          text: 'USA:  Demokraterna håller konvent i Chicago, Illinois (till 22/8). Under kvällen amerikansk tid (natten mot onsdag svensk tid) ska tidigare presidenten Barack Obama hålla tal. \nPresidentkandidaten Kamala Harris reser under dagen till Milwaukee i närliggande delstaten Wisconsin för ett kampanjmöte men återvänder till Chicago under eftermiddagen.'
        },
        rel: '',
        role: 'public',
        name: '',
        value: '',
        contenttype: '',
        sensitivity: '',
        links: [],
        content: [],
        meta: []
      }
    ],
    links: [
      {
        id: '',
        uuid: 'd18288d8-2582-4c6d-83ed-7403c61259cd',
        uri: '',
        url: '',
        type: 'core/story',
        title: 'Presidentvalet i USA',
        data: {},
        rel: 'story',
        role: '',
        name: '',
        value: '',
        contenttype: '',
        sensitivity: '',
        links: [],
        content: [],
        meta: []
      },
      {
        id: '',
        uuid: 'df76e035-7b92-5d1d-a3b0-77e2fb56b9df',
        uri: 'iptc://mediatopic/11000000',
        url: '',
        type: 'core/category',
        title: 'Politik',
        data: {},
        rel: 'category',
        role: '',
        name: '',
        value: '',
        contenttype: '',
        sensitivity: '',
        links: [],
        content: [],
        meta: []
      },
      {
        id: '',
        uuid: '', // <-- Currently UUID missing
        uri: '',
        url: '',
        type: 'core/section',
        title: 'Utrikes',
        data: {},
        rel: 'section',
        role: '',
        name: '',
        value: '',
        contenttype: '',
        sensitivity: '',
        links: [],
        content: [],
        meta: []
      },
      {
        id: '',
        uuid: '',
        uri: '',
        url: '',
        type: '',
        title: 'TT',
        data: {},
        rel: 'copyrightholder',
        role: '',
        name: '',
        value: '',
        contenttype: '',
        sensitivity: '',
        links: [],
        content: [],
        meta: []
      }
    ],
    language: 'sv-se'
  }
}
