export const currentView = (): { name: string, props: Record<string, string> } => {
  let name = ''

  if (window.location.pathname !== import.meta.env.BASE_URL &&
    window.location.pathname !== import.meta.env.BASE_URL + '/') {
    const nameFromPath = window.location.pathname
      .replace(import.meta.env.BASE_URL, '')
      .replace(/\/$/, '')

    name = nameFromPath[1]?.toUpperCase() + nameFromPath.slice(2)
  } else {
    name = 'PlanningOverview'
  }

  const props = Object.fromEntries(new URLSearchParams(window.location.search))

  return {
    name,
    props
  }
}
