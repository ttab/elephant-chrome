export function getPublishTime(assignmentPublishTimes: string[]): string | undefined {
  if (!Array.isArray(assignmentPublishTimes)) {
    return
  }

  const startTimes = assignmentPublishTimes.filter(dt => {
    return !!dt
  }).sort((dt1, dt2) => {
    return dt1 >= dt2 ? 1 : -1
  })

  if (!startTimes.length) {
    return
  }
  return startTimes[0]
}
