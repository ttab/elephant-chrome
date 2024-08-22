import { type GetDocumentResponse } from '@/protos/service'

export const article: GetDocumentResponse = {
  version: 14n,
  document: {
    uuid: '5a848227-902b-425b-843e-0dd2cd67894b',
    type: 'core/article',
    uri: 'core://article/5a848227-902b-425b-843e-0dd2cd67894b',
    url: '',
    title: 'mjölkolycka',
    content: [
      {
        id: 'NzUsMjQ2LDIwOCwxNTE',
        uuid: '',
        uri: '',
        url: '',
        type: 'core/text',
        title: '',
        data: {
          text: '10|000 liter mjölk läckte vid E6'
        },
        rel: '',
        role: 'heading-1',
        name: '',
        value: '',
        contentType: '',
        links: [],
        content: [],
        meta: []
      },
      {
        id: 'MTY5LDIxMCwxMDAsMTQw',
        uuid: '',
        uri: '',
        url: '',
        type: 'tt/visual',
        title: '',
        data: {
          caption: 'En stor mängd mjölk spilldes över vägbanan i samband med en olycka i Falkenberg. Arkivbild.'
        },
        rel: '',
        role: '',
        name: '',
        value: '',
        contentType: '',
        links: [
          {
            id: '',
            uuid: '',
            uri: 'http://example.com/media/image/abc',
            url: 'https://example.com/media/image/abc.jpg',
            type: 'tt/picture',
            title: '',
            data: {
              width: '1024',
              credit: 'John Doe/TT',
              height: '642'
            },
            rel: 'self',
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
        meta: []
      },
      {
        id: 'pagedateline-5b8149a71b05cef3c73af71ca95c555d',
        uuid: '',
        uri: '',
        url: '',
        type: 'core/text',
        title: '',
        data: {
          text: 'Trafik'
        },
        rel: '',
        role: 'vignette',
        name: '',
        value: '',
        contentType: '',
        links: [],
        content: [],
        meta: []
      },
      {
        id: 'MjEwLDQyLDI3LDgy',
        uuid: '',
        uri: '',
        url: '',
        type: 'core/text',
        title: '',
        data: {
          text: 'Omkring 10|000 liter mjölk läckte ut på vägbanan när en tankbil välte på en avfart från E6 i Falkenberg natten till onsdag, rapporterar <a href="https://www.example.com./newss/article" id="link-8f370161883287209b20750f478c18f1">Göteborgs-Posten</a>.'
        },
        rel: '',
        role: 'preamble',
        name: '',
        value: '',
        contentType: '',
        links: [],
        content: [],
        meta: []
      },
      {
        id: 'paragraph-2befcb2ca02cfac9c727d822dffd82de',
        uuid: '',
        uri: '',
        url: '',
        type: 'core/text',
        title: '',
        data: {
          text: '– Det är många mjölkpaket, säger Peter Karlborg, inre befäl vid räddningstjänsten, till tidningen.'
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
        id: 'paragraph-2fc0a7eb7900fce72fa3a78bf04e38d8',
        uuid: '',
        uri: '',
        url: '',
        type: 'core/text',
        title: '',
        data: {
          text: 'Föraren skadades inte i olyckan. Avfarten stängdes av i norrgående riktning medan olyckan hanterades. Den spillda mjölken krävde ingen åtgärd.'
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
        id: 'paragraph-03db0ec2a20e8b4c06a3757518d2e506',
        uuid: '',
        uri: '',
        url: '',
        type: 'core/text',
        title: '',
        data: {
          text: '– Det är ingen tjäle nu och det finns inga vattendrag i närheten, så mjölken går ner i marken bara, säger Karlborg.'
        },
        rel: '',
        role: '',
        name: '',
        value: '',
        contentType: '',
        links: [],
        content: [],
        meta: []
      }
    ],
    meta: [
      {
        id: '',
        uuid: '',
        uri: '',
        url: '',
        type: 'core/newsvalue',
        title: '',
        data: {
          score: '2',
          duration: '86400'
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
        value: 'mjölkolycka',
        contentType: '',
        links: [],
        content: [],
        meta: []
      }
    ],
    links: [
      {
        id: '',
        uuid: '21543138-859a-49a8-ad9e-2c10dc2d33b1',
        uri: '',
        url: '',
        type: 'core/assignment',
        title: '',
        data: {},
        rel: 'assignment',
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
        uuid: '956636ed-2687-4bc3-a45a-7e09d98c6eeb',
        uri: '',
        url: '',
        type: 'core/section',
        title: 'Inrikes',
        data: {},
        rel: 'subject',
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
        uuid: '',
        uri: 'tt://content-source/tt',
        url: '',
        type: 'core/content-source',
        title: '',
        data: {},
        rel: 'source',
        role: '',
        name: '',
        value: '',
        contentType: '',
        links: [],
        content: [],
        meta: []
      }
    ],
    language: 'sv'
  }
}
