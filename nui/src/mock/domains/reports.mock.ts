/**
 * Mock data and handlers for the Reports domain.
 * Covers: report list, report detail, claim, close, close similar.
 */

import type { Report } from '../../types'
import type { DomainMock } from '../types'
import { jsonResponse, toastAndReturn } from '../types'
import { mockToasts } from './players.mock'

// ---- Demo Data ----

export const DEMO_REPORTS: Report[] = [
  {
    id: 42,
    type: 0,
    reporter: 5,
    reporterName: 'Eve Adams',
    reported: 2,
    reportedName: 'Bob Smith',
    reason: 'Camping rooftop with sniper',
    reportTimeFormatted: '2m ago',
  },
  {
    id: 43,
    type: 1,
    reporter: 4,
    reporterName: 'Diana Prince',
    reported: 6,
    reportedName: 'Frank Castle',
    reason: 'Emergency: vehicle ramming on foot',
    reportTimeFormatted: '5m ago',
    claimed: true,
    claimedName: 'admin_alice',
  },
  {
    id: 44,
    type: 0,
    reporter: 7,
    reporterName: 'Grace Hopper',
    reason: 'Suspected cheating (infinite ammo)',
    reportTimeFormatted: '12m ago',
  },
  {
    id: 45,
    type: 0,
    reporter: 1,
    reporterName: 'Alice Johnson',
    reported: 3,
    reportedName: 'Charlie Brown',
    reason: 'Blocking road with vehicle repeatedly',
    reportTimeFormatted: '20m ago',
  },
  {
    id: 46,
    type: 1,
    reporter: 8,
    reporterName: 'Hank Pym',
    reported: 5,
    reportedName: 'Eve Adams',
    reason: 'Emergency: player threatening self-harm IC',
    reportTimeFormatted: '25m ago',
  },
  {
    id: 47,
    type: 0,
    reporter: 2,
    reporterName: 'Bob Smith',
    reported: 7,
    reportedName: 'Grace Hopper',
    reason: 'Non-stop voice chat spam',
    reportTimeFormatted: '30m ago',
    claimed: true,
    claimedName: 'admin_bob',
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
  return toastAndReturn('Report claimed', 'success', {}, mockToasts)
}

async function handleCloseReport(body: Record<string, unknown>): Promise<Response> {
  mockReports = mockReports.filter((r) => r.id !== Number(body.id))
  pushReportsUpdate()
  return toastAndReturn('Report closed', 'success', {}, mockToasts)
}

async function handleCloseSimilarReports(body: Record<string, unknown>): Promise<Response> {
  const target = mockReports.find((r) => r.id === Number(body.id))
  if (target) {
    mockReports = mockReports.filter(
      (r) => !(r.reporter === target.reporter && r.reported === target.reported),
    )
  }
  pushReportsUpdate()
  return toastAndReturn('Similar reports closed', 'success', {}, mockToasts)
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
