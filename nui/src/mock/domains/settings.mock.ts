/**
 * Mock data and handlers for the Settings domain.
 * Covers: anonymous mode, easter eggs, license visibility, KVP, close menu.
 */

import type { DomainMock } from '../types'
import { jsonResponse } from '../types'

// ---- Handlers ----

async function handleSetAnonymous(): Promise<Response> {
  return jsonResponse({ success: true })
}

async function handleSetEasterEgg(): Promise<Response> {
  return jsonResponse({ success: true })
}

async function handleSetShowLicenses(): Promise<Response> {
  return jsonResponse({ success: true })
}

async function handleSetResourceKvp(): Promise<Response> {
  return jsonResponse({ success: true })
}

async function handleCloseMenu(): Promise<Response> {
  window.postMessage({ action: 'menuToggle', data: { visible: false } }, '*')
  return jsonResponse({ success: true })
}

export const settingsMock: DomainMock = {
  handlers: {
    setAnonymous: handleSetAnonymous,
    setEasterEgg: handleSetEasterEgg,
    setShowLicenses: handleSetShowLicenses,
    setResourceKvp: handleSetResourceKvp,
    closeMenu: handleCloseMenu,
  },
}
