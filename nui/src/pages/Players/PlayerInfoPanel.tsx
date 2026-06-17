import type { Player } from '../../types'
import { Avatar } from '../../components/Avatar'
import { KeyValueTable, type KeyValueRow } from '../../components/KeyValueTable'
import { CopyButton } from '../../components/CopyButton'
import { RoleBadges } from '../../components/RoleBadges'

interface PlayerInfoPanelProps {
  player: Player
  onCopyDiscord: () => void
}

export function PlayerInfoPanel({ player, onCopyDiscord }: PlayerInfoPanelProps) {
  const rows: KeyValueRow[] = []

  if (player.license) {
    rows.push({ key: 'License', value: player.license, mono: true })
  }
  if (player.discord) {
    rows.push({
      key: 'Discord',
      value: player.discord,
      mono: true,
      actionLabel: <CopyButton value={player.discord} onCopy={onCopyDiscord} ariaLabel="Copy Discord ID" />,
    })
  }
  if (player.xbl) {
    rows.push({ key: 'XBL', value: player.xbl, mono: true })
  }
  if (player.identifier) {
    rows.push({ key: 'Identifier', value: player.identifier, mono: true })
  }
  if (player.ip) {
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
        <Avatar player={player} size="lg" variant="player" />
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
    </div>
  )
}
