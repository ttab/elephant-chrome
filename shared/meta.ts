/**
 * Helper function to create meta auth obj
 */
export function meta(accessToken: string, abort?: AbortSignal) {
  return {
    meta: {
      authorization: `bearer ${accessToken}`
export function meta(accessToken: string, abort?: AbortSignal): RpcOptions {
  return {
    meta: {
      authorization: `bearer ${accessToken}`
    },
    abort
  }
}

  }
}
