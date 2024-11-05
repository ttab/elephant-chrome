export function pagination(paginationOptions?: {
  page: number
  size: number
}): { from: number, pageSize: number } {
  const defaultPageSize = 100
  const defaultPage = 1

  let {
    page = defaultPage,
    size: pageSize = defaultPageSize
  } = paginationOptions || {}

  if (isNaN(page) || page < 1) {
    page = defaultPage
  }

  if (isNaN(pageSize) || pageSize < 1 || pageSize > 1000) {
    pageSize = defaultPageSize
  }

  return {
    from: (page - 1) * pageSize,
    pageSize
  }
}
