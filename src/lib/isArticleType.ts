export function isArticleType(type: string | undefined): boolean {
  return type === 'core/article' || type === 'core/article#timeless'
}
