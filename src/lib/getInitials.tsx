export function getInitials(assignee: string | undefined): string {
  if (!assignee) return '??'

  try {
    const [first, last] = assignee.trim().split(' ')
    return `${first[0]}${last[0]}`
  } catch (err) {
    console.log(err)
    return '??'
  }
}
