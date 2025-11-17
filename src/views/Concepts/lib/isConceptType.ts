import { tableDataMap } from './conceptDataTable'

export const isConceptType = (type: string | undefined): boolean => {
  if (type === undefined) {
    return false
  } else {
    return type in tableDataMap || Object.values(tableDataMap).some((inneKey) => Object.values(inneKey).includes(type))
  }
}
