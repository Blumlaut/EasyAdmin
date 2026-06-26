/**
 * Browser dev mock for FiveM NUI globals.
 * Auto-activates when `?dev` is in the URL.
 *
 * Provides demo data and intercepts callLua so the UI is fully interactive
 * without running FiveM.
 *
 * Domain-specific mock data and handlers are in ./mock/domains/*.
 */

import { bodyToString, jsonResponse } from './mock/types'
import {
  playersMock,
  bansMock,
  reportsMock,
  statisticsMock,
  resourcesMock,
  dashboardMock,
  serverMock,
  settingsMock,
  profilerMock,
  pluginsMock,
  DEMO_PLAYERS,
  DEMO_PERMISSIONS,
  DEMO_REPORTS,
} from './mock/domains'

// ---- Merge all domain handlers into a single lookup ----

const HANDLERS: Record<string, NonNullable<Parameters<typeof executeHandler>[0]>> = {
  ...playersMock.handlers,
  ...bansMock.handlers,
  ...reportsMock.handlers,
  ...statisticsMock.handlers,
  ...resourcesMock.handlers,
  ...dashboardMock.handlers,
  ...serverMock.handlers,
  ...settingsMock.handlers,
  ...profilerMock.handlers,
  ...pluginsMock.handlers,
}

async function executeHandler(fn: (body: Record<string, unknown>) => Promise<Response>, body: Record<string, unknown>): Promise<Response> {
  // Simulate async delay like a real server
  await new Promise((resolve) => setTimeout(resolve, 100))
  return fn(body)
}

// ---- Intercept fetch calls that go to the Lua backend ----

const originalFetch = window.fetch
window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  if (typeof input === 'string' && input.includes('/EasyAdmin/')) {
    const action = input.split('/').pop() || ''
    const body = init?.body ? JSON.parse(bodyToString(init.body)) : {}

    const handler = HANDLERS[action]
    if (handler) {
      return executeHandler(handler, body)
    }

    console.warn('[mock] Unknown action:', action)
    return jsonResponse({ success: false })
  }
  return originalFetch(input, init)
}

// ---- Provide the FiveM global ----

// @ts-expect-error FiveM global not in lib.dom
;(window as Record<string, unknown>).parentResourceName = 'EasyAdmin'

// ---- Auto-open the menu and push initial data after a short delay ----

setTimeout(() => {
  window.postMessage({ action: 'menuToggle', data: { visible: true } }, '*')
  window.postMessage({
    action: 'updatePlayers',
    data: {
      players: DEMO_PLAYERS,
      permissions: DEMO_PERMISSIONS,
      redm: false,
      ipprivacy: false,
    },
  }, '*')
  window.postMessage({
    action: 'initEasterEggs',
    data: { easterEggs: ['pride', 'logo-hardadmin', 'banner-hardadmin'], currentEgg: null },
  }, '*')
  window.postMessage({
    action: 'initSettings',
    data: {
      anonymous: false,
      highContrast: false,
      fontSize: 12,
      sidebarMode: 'vertical',
      sidebarDirection: 'right',
    },
  }, '*')
  window.postMessage({
    action: 'updateReports',
    data: { reports: DEMO_REPORTS },
  }, '*')
}, 500)

// eslint-disable-next-line no-console -- dev-only banner
console.log(
  '%c[EasyAdmin NUI Dev Mode] Mock active. Use the UI freely.',
  'color: #4ade80; font-weight: bold; font-size: 14px;',
)
