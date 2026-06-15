import type { Player } from '../../types'
import { KeyValueTable, type KeyValueRow } from '../../components/KeyValueTable'
import { Icon } from '../../components/icons'

interface PlayerInfoPanelProps {
  player: Player
  ipPrivacy: boolean
  onCopyDiscord: () => void
}

export function PlayerInfoPanel({ player, ipPrivacy, onCopyDiscord }: PlayerInfoPanelProps) {
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

  return (
    <div className="card">
      <div className="flex items-center gap-4 mb-3">
        <div className="avatar avatar-lg">
          {player.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-semibold truncate">{player.name}</h3>
          <p className="text-sm text-muted text-mono">ID: {player.id}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {player.frozen && <span className="badge badge-frozen">Frozen</span>}
          {player.muted && <span className="badge badge-muted">Muted</span>}
          {player.developer && <span className="badge badge-dev">Dev</span>}
          {player.contributor && (
            <span className="badge badge-contributor">Contrib</span>
          )}
        </div>
      </div>
      <KeyValueTable rows={rows} ariaLabel="Player info" />
      {player.ip && ipPrivacy && (
        <p className="text-xs text-muted flex items-center gap-1 mt-2">
          <Icon name="shield" size="xs" />
          IP hidden by ea_IpPrivacy
        </p>
      )}
    </div>
  )
}
