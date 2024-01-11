export function getInitials(assignee: string): string {
  const [first, last] = assignee.trim().split(' ')

  if (!first.length || !last.length) {
    return '??'
  }
  return `${first[0]}${last[0]}`
}
