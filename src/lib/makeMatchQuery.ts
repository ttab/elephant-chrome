export const makeMatchQuery = (param: string | string[], field: string) => {
  if (Array.isArray(param)) {
    return {
      terms: {
        [field]: param
      }
    }
  } else {
    return {
      match: {
        [field]: param
      }
    }
  }
}
