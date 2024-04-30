import ReactDOM from 'react-dom/client'
import { App } from './App.tsx'
import { ThemeProvider, SessionProvider, RegistryProvider, HPWebSocketProvider } from '@/contexts'
import { NavigationProvider } from '@/navigation'
import { banner } from './lib/banner.ts'
import * as views from '@/views'

banner()

// Right now the navigation providers sets itself up on module init, that should
// be part of an explicit initialisation phase instead.
const appSetup = {
  // Right now all views need to know about the base url variable, move that to
  // setup.
  basePath: import.meta.env.BASE_URL,
  // Views get mapped to specific paths, but we invert the control here. We want
  // elephant to be extensible, right now it's built more as a static
  // application.
  views: {
    '/': views.PlanningOverview,
    '/editor': views.Editor,
    '/planning': views.Planning
  }
}

const root = document.getElementById('root')

if (!root) {
  throw new Error('Can not getElementById("root")')
}

ReactDOM.createRoot(root).render(
  <SessionProvider>
    <RegistryProvider>
      <HPWebSocketProvider>
        <ThemeProvider defaultTheme='light' storageKey='ele-ui-theme' >
          <NavigationProvider>
            <App />
          </NavigationProvider>
        </ThemeProvider >
      </HPWebSocketProvider>
    </RegistryProvider>
  </SessionProvider>
)
