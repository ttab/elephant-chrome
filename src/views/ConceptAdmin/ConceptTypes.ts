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
import { CogIcon } from '@ttab/elephant-ui/icons'

export const Concepts: conceptItem[] = [
  {
    label: 'Sektion',
    description: 'Övergripande kategorier för nyheter',
    path: 'core/section',
    icon: CogIcon
  },
  {
    label: 'Story',
    description: '',
    path: 'core/story',
    icon: CogIcon
  },
  {
    label: 'Kategori',
    description: '',
    path: 'core/category',
    icon: CogIcon
  },
  {
    label: 'Organisatör',
    description: '',
    path: 'core/organiser',
    icon: CogIcon
  },
  {
    label: 'Plats',
    description: '',
    path: 'core/place',
    icon: CogIcon
  },
  {
    label: 'Content Source',
    description: '',
    path: 'core/content-source',
    icon: CogIcon
  },
  {
    label: 'Wire Source',
    description: '',
    path: 'tt/wwire-source',
    icon: CogIcon
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
