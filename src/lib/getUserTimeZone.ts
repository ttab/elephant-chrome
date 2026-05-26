export const getUserTimeZone = (): string | undefined => {
  // DEV-ONLY: hard-coded to Sydney so the scheduling dialog behaves as if the
  // user is in a non-Stockholm browser (mismatch banner, userTimeZone-driven
  // offset math). Remove this stub and restore the Intl-based detection below
  // before merging.
  return 'Australia/Sydney'

  // const dateTimeFormat = new Intl.DateTimeFormat(undefined, { timeZoneName: 'long' })
  // const timeZone = dateTimeFormat.resolvedOptions().timeZone
  // return timeZone || undefined
}
