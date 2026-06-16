import { copyToClipboard } from '../../utils/clipboard'
import type { Player } from '../../types'
import { KeyValueTable, type KeyValueRow } from '../../components/KeyValueTable'
import { Icon } from '../../components/icons'
import { RoleBadges } from '../../components/RoleBadges'

interface PlayerInfoPanelProps {
  player: Player
  ipPrivacy: boolean
  identifiers: string[] | null
  onCopyDiscord: () => void
}

export function PlayerInfoPanel({ player, ipPrivacy, identifiers, onCopyDiscord }: PlayerInfoPanelProps) {
  const rows: KeyValueRow[] = [
    { key: 'ID', value: player.id, mono: true },
    { key: 'Name', value: player.name },
  ]

  if (player.license) {
    rows.push({ key: 'License', value: player.license, mono: true })
  }
  if (player.discord) {
    rows.push({
      key: 'Discord',
      value: player.discord,
      mono: true,
      onClick: onCopyDiscord,
      actionLabel: 'Copy',
    })
  }
  if (player.xbl) {
    rows.push({ key: 'XBL', value: player.xbl, mono: true })
  }
  if (player.identifier) {
    rows.push({ key: 'Identifier', value: player.identifier, mono: true })
  }
  if (player.ip && !ipPrivacy) {
    rows.push({ key: 'IP', value: player.ip, mono: true })
  }
  if (player.coords) {
    rows.push({
      key: 'Coords',
      value: `${player.coords.x.toFixed(1)}, ${player.coords.y.toFixed(1)}, ${player.coords.z.toFixed(1)}`,
      mono: true,
    })
  }
  if (player.selfbucket !== undefined) {
    rows.push({ key: 'Bucket', value: player.selfbucket, mono: true })
  }

  // Filter out IP identifiers when privacy is enabled
  const visibleIdentifiers = (identifiers ?? []).filter((id) => {
    if (ipPrivacy && id.split(':')[0] === 'ip') return false
    return true
  })

  return (
    <div className="card">
      <div className="flex items-center gap-4 mb-3">
        <div className="avatar avatar-lg avatar-player">
          {player.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xl font-bold truncate">{player.name}</h3>
            <RoleBadges player={player} />
          </div>
          <p className="text-sm text-muted text-mono">ID: {player.id}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {player.frozen && <span className="badge badge-frozen">Frozen</span>}
          {player.muted && <span className="badge badge-muted">Muted</span>}
        </div>
      </div>
      <KeyValueTable rows={rows} ariaLabel="Player info" />

      {visibleIdentifiers.length > 0 && (
        <div className="mt-3">
          <p className="section-label">
            Identifiers
            <span className="text-sm text-muted identifier-count">{visibleIdentifiers.length}</span>
          </p>
          <ul className="flex flex-col gap-1">
            {visibleIdentifiers.map((id) => {
              const [kind, value] = id.split(':')
              return (
                <li
                  key={id}
                  className="flex items-center gap-2 text-mono text-sm identifier-row"
                >
                  <span className="badge badge-default">{kind}</span>
                  <span className="truncate flex-1">{value ?? id}</span>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => copyToClipboard(id)}
                    aria-label={`Copy ${kind}`}
                  >
                    Copy
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {player.ip && ipPrivacy && (
        <p className="text-xs text-muted flex items-center gap-1 mt-2">
          <Icon name="shield" size="xs" />
          IP hidden by ea_IpPrivacy
        </p>
      )}
    </div>
  )
}
