import { test as base, expect } from '@playwright/test'
import path from 'node:path'
import { ApprovalsPage } from '../pages/approvals.page'
import { AssignmentsPage } from '../pages/assignments.page'
import { EditorPage } from '../pages/editor.page'
import { EventPage } from '../pages/event.page'
import { EventsOverviewPage } from '../pages/events-overview.page'
import { FactboxPage } from '../pages/factbox.page'
import { FlashPage } from '../pages/flash.page'
import { LatestPage } from '../pages/latest.page'
import { LoginPage } from '../pages/login.page'
import { PlanningPage } from '../pages/planning.page'
import { PlanningOverviewPage } from '../pages/planning-overview.page'
import { PrintArticlesPage } from '../pages/print-articles.page'
import { PrintEditorPage } from '../pages/print-editor.page'
import { QuickArticlePage } from '../pages/quick-article.page'
import { SearchPage } from '../pages/search.page'
import { FactboxesOverviewPage } from '../pages/factboxes.page'
import { ImageSearchPage } from '../pages/image-search.page'
import { WiresPage } from '../pages/wires.page'

const AUTH_FILE = path.resolve(import.meta.dirname, '../.auth/user.json')

type Fixtures = {
  loginPage: LoginPage
  editorPage: EditorPage
  planningPage: PlanningPage
  planningOverviewPage: PlanningOverviewPage
  eventPage: EventPage
  eventsOverviewPage: EventsOverviewPage
  factboxPage: FactboxPage
  flashPage: FlashPage
  latestPage: LatestPage
  approvalsPage: ApprovalsPage
  assignmentsPage: AssignmentsPage
  searchPage: SearchPage
  quickArticlePage: QuickArticlePage
  wiresPage: WiresPage
  printEditorPage: PrintEditorPage
  printArticlesPage: PrintArticlesPage
  factboxesPage: FactboxesOverviewPage
  imageSearchPage: ImageSearchPage
}

/* eslint-disable react-hooks/rules-of-hooks -- Playwright's `use` fixture callback, not React's hook */
export const test = base.extend<Fixtures>({
  storageState: AUTH_FILE,

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page))
  },

  editorPage: async ({ page }, use) => {
    await use(new EditorPage(page))
  },

  planningPage: async ({ page }, use) => {
    await use(new PlanningPage(page))
  },

  planningOverviewPage: async ({ page }, use) => {
    await use(new PlanningOverviewPage(page))
  },

  eventPage: async ({ page }, use) => {
    await use(new EventPage(page))
  },

  eventsOverviewPage: async ({ page }, use) => {
    await use(new EventsOverviewPage(page))
  },

  factboxPage: async ({ page }, use) => {
    await use(new FactboxPage(page))
  },

  flashPage: async ({ page }, use) => {
    await use(new FlashPage(page))
  },

  latestPage: async ({ page }, use) => {
    await use(new LatestPage(page))
  },

  approvalsPage: async ({ page }, use) => {
    await use(new ApprovalsPage(page))
  },

  assignmentsPage: async ({ page }, use) => {
    await use(new AssignmentsPage(page))
  },

  searchPage: async ({ page }, use) => {
    await use(new SearchPage(page))
  },

  quickArticlePage: async ({ page }, use) => {
    await use(new QuickArticlePage(page))
  },

  wiresPage: async ({ page }, use) => {
    await use(new WiresPage(page))
  },

  printEditorPage: async ({ page }, use) => {
    await use(new PrintEditorPage(page))
  },

  printArticlesPage: async ({ page }, use) => {
    await use(new PrintArticlesPage(page))
  },

  factboxesPage: async ({ page }, use) => {
    await use(new FactboxesOverviewPage(page))
  },

  imageSearchPage: async ({ page }, use) => {
    await use(new ImageSearchPage(page))
  }
})

export { expect }
