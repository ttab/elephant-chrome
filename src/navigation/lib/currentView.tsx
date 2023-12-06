export const currentView = (): { name: string, props: Record<string, string> } => {
  let name = ''

  if (window.location.pathname !== '/') {
    name = window.location.pathname[1]?.toUpperCase() + window.location.pathname.slice(2)
  } else {
    name = 'PlanningOverview'
  }

  const props = Object.fromEntries(new URLSearchParams(window.location.search))

  return {
    name,
    props
  }
}
