export const getUserTimeZone = (): string | undefined => {
  // Create a DateTimeFormat object with an undefined locale
  const dateTimeFormat = new Intl.DateTimeFormat(undefined, { timeZoneName: 'long' })

  // Retrieve the resolved options, which includes the timeZone
  const timeZone = dateTimeFormat.resolvedOptions().timeZone

  // Return timeZone or specifically undefined as timeZone _can_ be privacy protected by some users
  return timeZone || undefined
}
