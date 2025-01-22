import type { StatusOverviewItem } from '@ttab/elephant-api/repository'

/**
 * Determines the current status of a deliverable
 *
 * @param {StatusOverviewItem} item Status item coming from result of GetStatusOverView request
 * @returns {string} The current status of an article as a string
 */
export const getStatus = (item: StatusOverviewItem) => {
  const draftStatus = 'draft'
  const currentVersion = item.version
  const headsKeys = Object.keys(item?.heads)

  // If there are no statuses set in item.heads, default to 'draft' status
  if (headsKeys.length === 0) {
    return 'draft'
  } else {
    // If there are statuses set in item.heads, check versions.
    // If the current version is higher than all of the heads versions, default to 'draft'
    const headsVersions = headsKeys.map((key) => item.heads[key]?.version)
    const currentIsNewest = headsVersions.every((version) => version < currentVersion)

    if (currentIsNewest) {
      return 'draft'
    }

    if (!currentIsNewest) {
      const latestStatus = headsKeys.filter((key) => item.heads[key].version === currentVersion)
      if (latestStatus.length === 1) {
        return latestStatus[0]
      }

      if (latestStatus.length > 1) {
        const sortByCreated = headsKeys.sort((a, b) => item.heads[a].created > item.heads[b].created ? -1 : 1)
        return sortByCreated[0]
      }
    }
  }

  return draftStatus
}
