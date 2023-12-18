export function getPublishTime(assignmentPublishTimes: string[]): Date | undefined {
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

  const date = new Date(startTimes[0])

  if (isNaN(date.getTime()) || date.toString() === 'Invalid Date') {
    return
  }
  return date
}
