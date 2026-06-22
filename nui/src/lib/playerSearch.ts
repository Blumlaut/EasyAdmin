import type { Player, CachedPlayer } from '../types'

// Known FiveM identifier prefixes
const IDENTIFIER_PREFIXES = ['steam:', 'discord:', 'license:', 'license2:', 'xbl:', 'fivem:', 'ip:']

/**
 * Check if a query string looks like an identifier (has a known prefix).
 */
function isIdentifierQuery(query: string): boolean {
  const lower = query.toLowerCase()
  return IDENTIFIER_PREFIXES.some((prefix) => lower.startsWith(prefix))
}

/**
 * Normalize an identifier for comparison (lowercase, trimmed).
 */
function normalizeIdentifier(value: string | undefined): string {
  return (value ?? '').toLowerCase().trim()
}

/**
 * Extract the value part after a prefix (e.g. "steam:123" → "123").
 * If no known prefix is found, returns the full string as-is.
 */
function extractIdentifierValue(query: string): string {
  const lower = query.toLowerCase()
  for (const prefix of IDENTIFIER_PREFIXES) {
    if (lower.startsWith(prefix)) {
      return query.slice(prefix.length).toLowerCase().trim()
    }
  }
  return query.toLowerCase().trim()
}

/**
 * Check if a player's identifier field matches a query.
 * Supports full identifier match ("steam:123") and value-only match ("123").
 */
function identifierFieldMatches(field: string | undefined, query: string): boolean {
  if (!field) return false
  const normalized = normalizeIdentifier(field)
  const fullMatch = normalized === query.toLowerCase().trim()
  if (fullMatch) return true

  // Also match just the value part (after prefix)
  const queryValue = extractIdentifierValue(query)
  for (const prefix of IDENTIFIER_PREFIXES) {
    if (normalized.startsWith(prefix) && normalized.slice(prefix.length) === queryValue) {
      return true
    }
  }
  return false
}

/**
 * Filter online players by query.
 * - Identifier-like queries (with prefix) → exact match on identifier fields
 * - All other queries → fuzzy match on name and server ID
 */
export function filterPlayers(players: Player[], query: string): Player[] {
  if (!query) return players
  const trimmed = query.trim()
  if (!trimmed) return players

  if (isIdentifierQuery(trimmed)) {
    const q = trimmed.toLowerCase().trim()
    return players.filter((p) => {
      if (identifierFieldMatches(p.identifier, q)) return true
      if (identifierFieldMatches(p.discord, q)) return true
      if (identifierFieldMatches(p.license, q)) return true
      if (identifierFieldMatches(p.xbl, q)) return true
      return false
    })
  }

  // Fuzzy: name and server ID
  const q = trimmed.toLowerCase()
  return players.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      String(p.id).includes(q),
  )
}

/**
 * Filter cached (offline) players by query.
 * Same logic as filterPlayers but for CachedPlayer type.
 */
export function filterCachedPlayers(players: CachedPlayer[], query: string): CachedPlayer[] {
  if (!query) return players
  const trimmed = query.trim()
  if (!trimmed) return players

  if (isIdentifierQuery(trimmed)) {
    return players.filter((p) => identifierFieldMatches(p.identifier, trimmed))
  }

  // Fuzzy: name and server ID
  const q = trimmed.toLowerCase()
  return players.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      String(p.id).includes(q),
  )
}
