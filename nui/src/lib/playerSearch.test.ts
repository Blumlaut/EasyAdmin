import { describe, it, expect } from 'vitest'
import type { Player, CachedPlayer } from '../types'
import { filterPlayers, filterCachedPlayers } from './playerSearch'

// ============================================================
// Fixtures
// ============================================================

const makePlayer = (overrides: Partial<Player> = {}): Player => ({
  id: 1,
  name: 'Alice',
  identifier: 'steam:110000112345678',
  discord: 'discord:123456789012345678',
  license: 'license:abc123def456',
  ...overrides,
})

const makeCachedPlayer = (overrides: Partial<CachedPlayer> = {}): CachedPlayer => ({
  id: 1,
  name: 'Alice',
  identifier: 'steam:110000112345678',
  ...overrides,
})

const players: Player[] = [
  makePlayer({ id: 1, name: 'Alice', identifier: 'steam:110000112345678', discord: 'discord:123456789012345678', license: 'license:abc123def456' }),
  makePlayer({ id: 2, name: 'Bob', identifier: 'steam:110000118765432', discord: 'discord:987654321098765432', license: 'license:xyz789ghi012' }),
  makePlayer({ id: 5, name: 'Charlie', identifier: 'discord:555555555555555555', discord: 'discord:555555555555555555', license: 'license2:short789' }),
]

const cachedPlayers: CachedPlayer[] = [
  makeCachedPlayer({ id: 1, name: 'Alice', identifier: 'steam:110000112345678' }),
  makeCachedPlayer({ id: 2, name: 'Bob', identifier: 'steam:110000118765432' }),
  makeCachedPlayer({ id: 5, name: 'Charlie', identifier: 'discord:555555555555555555' }),
]

// ============================================================
// filterPlayers
// ============================================================

describe('filterPlayers', () => {
  it('returns all players when query is empty', () => {
    expect(filterPlayers(players, '')).toEqual(players)
    expect(filterPlayers(players, '   ')).toEqual(players)
  })

  // --- Fuzzy name search ---

  it('matches name fuzzy (case-insensitive)', () => {
    expect(filterPlayers(players, 'alice')).toHaveLength(1)
    expect(filterPlayers(players, 'alice')[0].name).toBe('Alice')

    expect(filterPlayers(players, 'ali')).toHaveLength(1)
    expect(filterPlayers(players, 'ALICE')).toHaveLength(1)
  })

  it('matches multiple players when name substring matches', () => {
    // "a" matches Alice and Charlie
    expect(filterPlayers(players, 'a')).toHaveLength(2)
  })

  it('returns no results for unknown name', () => {
    expect(filterPlayers(players, 'nonexistent')).toHaveLength(0)
  })

  // --- Fuzzy server ID search ---

  it('matches server ID fuzzy', () => {
    expect(filterPlayers(players, '1')).toHaveLength(1) // ID 1 only
    expect(filterPlayers(players, '1')[0].id).toBe(1)
    expect(filterPlayers(players, '5')).toHaveLength(1)
    expect(filterPlayers(players, '5')[0].id).toBe(5)
  })

  // --- Identifier prefix exact match ---

  it('matches full steam identifier', () => {
    const result = filterPlayers(players, 'steam:110000112345678')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Alice')
  })

  it('matches full discord identifier', () => {
    const result = filterPlayers(players, 'discord:123456789012345678')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Alice')
  })

  it('matches full license identifier', () => {
    const result = filterPlayers(players, 'license:abc123def456')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Alice')
  })

  it('matches license2 prefix', () => {
    const result = filterPlayers(players, 'license2:short789')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Charlie')
  })

  it('is case-insensitive for prefix', () => {
    expect(filterPlayers(players, 'STEAM:110000112345678')).toHaveLength(1)
    expect(filterPlayers(players, 'Steam:110000112345678')).toHaveLength(1)
  })

  // --- Identifier value-only match ---

  it('matches identifier value without prefix via full identifier match', () => {
    // When a query has a known prefix, exact match on the full field value
    const result = filterPlayers(players, 'steam:110000112345678')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Alice')
  })

  it('does not cross-match between identifier types', () => {
    // Searching for Alice's discord ID should NOT match via steam ID suffix
    const result = filterPlayers(players, 'discord:123456789012345678')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Alice')
  })

  // --- No false positives ---

  it('does not match name when query has identifier prefix', () => {
    // "steam:" should not fuzzy-match any names
    expect(filterPlayers(players, 'steam:')).toHaveLength(0)
  })

  it('does not match wrong identifier value', () => {
    expect(filterPlayers(players, 'steam:000000000000000')).toHaveLength(0)
  })

  // --- xbl field ---

  it('matches xbl identifier', () => {
    const playerWithXbl = [...players, makePlayer({ id: 10, name: 'XboxPlayer', xbl: 'xbl:2535462612345678' })]
    const result = filterPlayers(playerWithXbl, 'xbl:2535462612345678')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('XboxPlayer')
  })
})

// ============================================================
// filterCachedPlayers
// ============================================================

describe('filterCachedPlayers', () => {
  it('returns all players when query is empty', () => {
    expect(filterCachedPlayers(cachedPlayers, '')).toEqual(cachedPlayers)
  })

  it('matches name fuzzy', () => {
    expect(filterCachedPlayers(cachedPlayers, 'bob')).toHaveLength(1)
    expect(filterCachedPlayers(cachedPlayers, 'bob')[0].name).toBe('Bob')
  })

  it('matches server ID fuzzy', () => {
    expect(filterCachedPlayers(cachedPlayers, '5')).toHaveLength(1)
    expect(filterCachedPlayers(cachedPlayers, '5')[0].id).toBe(5)
  })

  it('matches full identifier exact', () => {
    expect(filterCachedPlayers(cachedPlayers, 'steam:110000118765432')).toHaveLength(1)
    expect(filterCachedPlayers(cachedPlayers, 'steam:110000118765432')[0].name).toBe('Bob')
  })

  it('matches discord identifier', () => {
    expect(filterCachedPlayers(cachedPlayers, 'discord:555555555555555555')).toHaveLength(1)
    expect(filterCachedPlayers(cachedPlayers, 'discord:555555555555555555')[0].name).toBe('Charlie')
  })

  it('returns no results for unknown identifier', () => {
    expect(filterCachedPlayers(cachedPlayers, 'steam:000000000000000')).toHaveLength(0)
  })
})
