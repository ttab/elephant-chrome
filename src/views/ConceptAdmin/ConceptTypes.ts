/*
nyhetsvärde - finns inte
uppdragstyper - finns inte
slottar (med timmar, labels, ikoner) - finns inte
synlighet - behövs det?
telegram-leverantör - finns tt/wire-providers
content-source

CAUSE_KEYS - finns inte
dokumentstatusar - oklart?
documentTypeValueFormat

default system time zone - finns inte
default system locale - finns inte
ƒ
workflowspecifications
applicationMenuItems */

import { Block } from '@ttab/elephant-api/newsdoc'
import type { LucideIcon } from '@ttab/elephant-ui/icons'
import { CircleSmallIcon, TagIcon } from '@ttab/elephant-ui/icons'

export const Concepts: conceptItem[] = [
  {
    label: 'Sektioner',
    description: 'A section for content',
    path: 'core/section',
    icon: TagIcon
  },
  {
    label: 'Story tags',
    description: 'An ongoing story that gets reported on',
    path: 'core/story',
    icon: TagIcon
  },
  {
    label: 'Kategorier',
    description: 'A category for content',
    path: 'core/category',
    icon: TagIcon
  },
  {
    label: 'Organisatörer',
    description: 'A document describing an organisation',
    path: 'core/organiser',
    icon: TagIcon
  },
  {
    label: 'Platser',
    description: 'A geographical location',
    path: 'core/place',
    icon: TagIcon
  },
  {
    label: 'Källor',
    description: 'The entity that is the source of the content, e.g. the organisation that produced it.',
    path: 'core/content-source',
    icon: TagIcon
  },
  {
    label: 'Telegramkällor',
    description: '',
    path: 'tt/wire-source',
    icon: TagIcon
  }
]

interface conceptItem {
  label: string
  description: string
  path: string
  icon: LucideIcon
}

export interface conceptType {
  _id: string
  label: string
  description: string // Custom description for what each type is used for
  type: string // path for example core/section
  title: string
  language?: string // ska det sättas från frontend
}

export interface conceptSection extends conceptType { // news section category etc kultur. nöje mmm
  // required BE
  uuid: string
  type: 'core/section'
  meta: [{
    type: 'core/section'
    data: {
      code: string
    }
  }]
  // required FE
  title: string
  description: string // Custom description for what each type is used for
}

export interface conceptStory extends conceptType { // story tag etc covid-19
  // required BE
  uuid: string
  type: 'core/story'
  // required FE
  title: string
  description: string // Custom description for what each type is used for
}

export interface conceptCategory extends conceptType { // broader category eg Tennis, Utbildning
  // required BE
  uuid: string
  type: 'core/category'
  uri: 'iptc://mediatopic' // + nummer på slutet
  // required FE
  title: string
}

export interface conceptOrganiser extends conceptType {
  // required BE
  uuid: string
  type: 'core/organiser'
  meta: { type: 'core/contact-info'
    // required FE
    id: string
    data: {
      city: string
      country: string
      streetAddress: string
    }
  }
  title: string
  links: [{
    url: string
    type: string
    rel: string // (see also)
  }]
}

export interface conceptPlace extends conceptType {
  // required BE
  uuid: string
  type: 'core/place'
  // required FE
  description: string
  title: string
  meta: [
    {
      type: 'core/position' // sätts det manuellt eller automatiskt
      value: string // WKT format
    },
    {
      type: 'core/place-type'
      value: 'city' | 'country' | 'county' | 'municipality'
    }
  ]
  links: [ // optional fields
    {
      uuid: string
      type: 'core/place'
      title: string
      rel: 'city' | 'country' | 'county' | 'municipality'
    }
  ]
}

export interface conceptConentSource extends conceptType {
  // Required BE
  uuid: string
  type: 'core/content-source'
  title: string

  // Required FE
  uri: string // tt://content-source/ + slug
}

export interface conceptWireSources extends conceptType {
  // required BE
  uuid: string
  type: 'tt/wire-source'
  uri: string // wires://source/ + slug
  title: string
}


const test = Block.create({
  type: 'core/place',
  value: ''
})

console.log(test)
