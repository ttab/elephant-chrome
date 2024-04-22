import { type GetDocumentResponse } from '@/protos/service'

export const planning: GetDocumentResponse = {
  version: 21n,
  document: {
    uuid: '726045e7-a52b-4737-8fba-c8149f7e2c2d',
    type: 'core/planning-item',
    uri: 'core://newscoverage/726045e7-a52b-4737-8fba-c8149f7e2c2d',
    url: '',
    title: 'Tomasson lämnar Blackburn – för landslaget?',
    content: [],
    meta: [
      {
        id: '',
        uuid: '',
        uri: '',
        url: '',
        type: 'core/planning-item',
        title: '',
        data: {
          public: 'true',
          end_date: '2024-02-09',
          priority: '4',
          tentative: 'false',
          start_date: '2024-02-09'
        },
        rel: '',
        role: '',
        name: '',
        value: '',
        contentType: '',
        links: [],
        content: [],
        meta: []
      },
      {
        id: '97464374-3d0c-44b9-9126-f5efadbd32a7',
        uuid: '',
        uri: '',
        url: '',
        type: 'core/assignment',
        title: 'Kortare text utsänd. Uppdateras',
        data: {
          end_date: '2024-02-09',
          full_day: 'true',
          start_date: '2024-02-09',
          end: '2024-02-09T22:59:59Z',
          start: '2024-02-08T23:00:00Z',
          public: 'true',
          publish: '2024-02-09T10:30:00Z'
        },
        rel: '',
        role: '',
        name: '',
        value: '',
        contentType: '',
        links: [
          {
            id: '',
            uuid: 'c37fdf3e-72ff-4e22-8b9f-1af0d60b0cd9',
            uri: '',
            url: '',
            type: 'core/author',
            title: '',
            data: {},
            rel: 'assignee',
            role: 'primary',
            name: 'John Doe/TT',
            value: '',
            contentType: '',
            links: [],
            content: [],
            meta: []
          },
          {
            id: '',
            uuid: 'f283c9a0-6a2e-4021-a009-087961dd032f',
            uri: '',
            url: '',
            type: 'core/article',
            title: '',
            data: {},
            rel: 'deliverable',
            role: '',
            name: '',
            value: '',
            contentType: '',
            links: [],
            content: [],
            meta: []
          },
          {
            id: '',
            uuid: 'f23c55de-5e52-428e-9ed7-0cdc0921f60a',
            uri: '',
            url: '',
            type: 'core/author',
            title: '',
            data: {},
            rel: 'assignee',
            role: 'primary',
            name: 'Jane Doe/TT',
            value: '',
            contentType: '',
            links: [],
            content: [],
            meta: []
          },
          {
            id: '',
            uuid: 'fa5e6fbf-c03d-4447-8a1f-550176979a48',
            uri: '',
            url: '',
            type: 'core/article',
            title: '',
            data: {},
            rel: 'deliverable',
            role: '',
            name: '',
            value: '',
            contentType: '',
            links: [],
            content: [],
            meta: []
          }
        ],
        content: [],
        meta: [
          {
            id: '',
            uuid: '',
            uri: '',
            url: '',
            type: 'tt/slugline',
            title: '',
            data: {},
            rel: '',
            role: '',
            name: '',
            value: 'lands-tomasson',
            contentType: '',
            links: [],
            content: [],
            meta: []
          },
          {
            id: '',
            uuid: '',
            uri: '',
            url: '',
            type: 'core/assignment-type',
            title: '',
            data: {},
            rel: '',
            role: '',
            name: '',
            value: 'text',
            contentType: '',
            links: [],
            content: [],
            meta: []
          }
        ]
      }
    ],
    links: [
      {
        id: '',
        uuid: 'a36ff853-9fb3-5950-8893-64ac699f5481',
        uri: 'sector://spt',
        url: '',
        type: 'tt/sector',
        title: 'Sport',
        data: {},
        rel: 'sector',
        role: '',
        name: '',
        value: 'SPT',
        contentType: '',
        links: [],
        content: [],
        meta: []
      }
    ],
    language: 'sv-se'
  }
}
