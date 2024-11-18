// Since window:crypto isn't compatible with node:cypto
// and we doesn't need a cryptographically secure hash we can use this simple hash function.
//
// Taken from https://stackoverflow.com/a/15710692
function createHash(s: string): number {
  return s.split('').reduce(function (a, b) {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
}

export default createHash
