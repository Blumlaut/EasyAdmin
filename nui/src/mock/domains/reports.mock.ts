/**
 * Mock data and handlers for the Reports domain.
 * Covers: report list, report detail, claim, close, close similar.
 */

import type { Report } from '../../types'
import type { DomainMock } from '../types'
import { jsonResponse } from '../types'

// ---- Demo Data ----

export const DEMO_REPORTS: Report[] = [
  {
    id: 42,
    type: 0,
    reporter: 5,
    reporterName: 'DukeOfCheese',
    reported: 2,
    reportedName: 'Jaccosf',
    reason: 'Camping rooftop with sniper',
    reportTimeFormatted: '2m ago',
  },
  {
    id: 43,
    type: 1,
    reporter: 4,
    reporterName: 'coleminer0112',
    reported: 6,
    reportedName: 'Blumlaut',
    reason: 'Emergency: vehicle ramming on foot',
    reportTimeFormatted: '5m ago',
    claimed: true,
    claimedName: 'Blumlaut',
  },
  {
    id: 44,
    type: 0,
    reporter: 7,
    reporterName: 'vecchiotom',
    reason: 'Suspected cheating (infinite ammo)',
    reportTimeFormatted: '12m ago',
  },
  {
    id: 45,
    type: 0,
    reporter: 1,
    reporterName: 'Gravxd',
    reported: 3,
    reportedName: 'zRxnx',
    reason: 'Blocking road with vehicle repeatedly',
    reportTimeFormatted: '20m ago',
  },
  {
    id: 46,
    type: 1,
    reporter: 8,
    reporterName: 'ewwepy',
    reported: 5,
    reportedName: 'DukeOfCheese',
    reason: 'Emergency: player threatening self-harm IC',
    reportTimeFormatted: '25m ago',
  },
  {
    id: 47,
    type: 0,
    reporter: 2,
    reporterName: 'Jaccosf',
    reported: 7,
    reportedName: 'vecchiotom',
    reason: 'Non-stop voice chat spam',
    reportTimeFormatted: '30m ago',
    claimed: true,
    claimedName: 'Blumlaut',
  },
]

// ---- Mutable state ----

let mockReports: Report[] = [...DEMO_REPORTS]

function pushReportsUpdate() {
  window.postMessage({ action: 'updateReports', data: { reports: mockReports } }, '*')
}

// ---- Handlers ----

async function handleRequestReports(): Promise<Response> {
  pushReportsUpdate()
  return jsonResponse({ success: true })
}

async function handleGetReportById(body: Record<string, unknown>): Promise<Response> {
  const report = mockReports.find((r) => r.id === Number(body.id))
  return jsonResponse({ report })
}

async function handleClaimReport(body: Record<string, unknown>): Promise<Response> {
  mockReports = mockReports.map((r) =>
    r.id === Number(body.id) ? { ...r, claimed: true, claimedName: 'admin_you' } : r,
  )
  pushReportsUpdate()
  return jsonResponse({ success: true })
}

async function handleCloseReport(body: Record<string, unknown>): Promise<Response> {
  mockReports = mockReports.filter((r) => r.id !== Number(body.id))
  pushReportsUpdate()
  return jsonResponse({ success: true })
}

async function handleCloseSimilarReports(body: Record<string, unknown>): Promise<Response> {
  const target = mockReports.find((r) => r.id === Number(body.id))
  if (target) {
    mockReports = mockReports.filter(
      (r) => !(r.reporter === target.reporter && r.reported === target.reported),
    )
  }
  pushReportsUpdate()
  return jsonResponse({ success: true })
}

export const reportsMock: DomainMock & { getReports: () => Report[] } = {
  handlers: {
    requestReports: handleRequestReports,
    getReportById: handleGetReportById,
    claimReport: handleClaimReport,
    closeReport: handleCloseReport,
    closeSimilarReports: handleCloseSimilarReports,
  },
  getReports: () => mockReports,
}
