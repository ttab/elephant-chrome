/**
 * Utility function to get a randomized jitter interval in milliseconds
 * based on min and max number of seconds for intervals. Used to reduce
 * thundering herd problems and reduce risk of instances running cleanup
 * simultaneously.
 * @param min - The minimum interval in seconds (inclusive).
 * @param max - The maximum interval in seconds (inclusive).
 * @returns A randomized interval in milliseconds.
 */
export function getInterval(min: number, max: number) {
  const minCeiled = Math.ceil(min)
  const maxFloored = Math.floor(max)
  return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled) * 1000
}
