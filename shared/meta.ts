/**
 * Helper function to create meta auth obj
 */
export function meta(accessToken: string): { meta: { authorization: string } } {
  return {
    meta: {
      authorization: `bearer ${accessToken}`
    }
  }
}
