export function getInitials(assignee: string | undefined): string {
  if (!assignee) return '??'

  try {
    const regex = /[ ]{2,}/g
    assignee = assignee.replace(regex, ' ').trim()
    const [first, last] = assignee.split(' ')
    return `${first[0]}${last[0]}`
  } catch (err) {
    console.log(err)
    return '??'
  }
}
