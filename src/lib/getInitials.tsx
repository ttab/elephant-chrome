export function getInitials(assignee: string): string {
  try {
    const [first, last] = assignee.trim().split(' ')
    return `${first[0]}${last[0]}`
  } catch {
    return '??'
  }
}
