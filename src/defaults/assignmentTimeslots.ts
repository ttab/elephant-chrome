type Slots = Record<string, { slots: number[], label: string }>

export const timesSlots: Slots = {
  fullday: {
    slots: [],
    label: 'Heldag'
  },
  morning: {
    slots: [0, 1, 2, 3, 4, 5, 6],
    label: 'Morgon'
  },
  forenoon: {
    slots: [7, 8, 9, 10, 11, 12],
    label: 'Förmiddag'
  },
  afternoon: {
    slots: [13, 14, 15, 16, 17, 18],
    label: 'Eftermiddag'
  },
  evening: {
    slots: [19, 20, 21, 22, 23],
    label: 'Kväll'
  }
}

export const slotLabels = [
  { value: 'fullday', label: 'Heldag' },
  { value: 'morning', label: 'Morgon' },
  { value: 'forenoon', label: 'Förmiddag' },
  { value: 'afternoon', label: 'Eftermiddag' },
  { value: 'evening', label: 'Kväll' }
]
