import { useState } from 'react'
import type { Player, Permissions } from '../types'
import { callLua } from '../fivem'

interface PlayerActionsProps {
  player: Player
  permissions: Permissions
  onConfirm: (title: string, message: string, callback: () => void) => void
  onToast: (text: string, type: 'info' | 'success' | 'error') => void
}

export function PlayerActions({ player, permissions, onConfirm, onToast }: PlayerActionsProps) {
  const [kickReason, setKickReason] = useState('')
  const [banReason, setBanReason] = useState('')
  const [banDuration, setBanDuration] = useState<number>(86400)
  const [warnReason, setWarnReason] = useState('')
  const [slapAmount, setSlapAmount] = useState(200)
  const [busy, setBusy] = useState(false)

  const handleAction = async (action: string, data?: Record<string, unknown>) => {
    setBusy(true)
    try {
      const result = await callLua<{ success?: boolean; error?: string }>(action, data)
      if (result.error) {
        onToast(result.error, 'error')
      } else {
        onToast('Action completed', 'success')
      }
    } catch (err) {
      onToast('Failed to execute action', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleKick = () => {
    onConfirm(
      'Kick Player',
      `Kick ${player.name}${kickReason ? ` with reason: "${kickReason}"` : ' with no reason'}?`,
      () => {
        handleAction('kickPlayer', { targetId: player.id, reason: kickReason || 'No reason' })
        setKickReason('')
      }
    )
  }

  const handleBan = () => {
    onConfirm(
      'Ban Player',
      `Ban ${player.name} for ${formatDuration(banDuration)}?`,
      () => {
        handleAction('banPlayer', {
          targetId: player.id,
          reason: banReason || 'No reason',
          duration: banDuration,
        })
        setBanReason('')
      }
    )
  }

  const handleWarn = () => {
    onConfirm(
      'Warn Player',
      `Warn ${player.name}${warnReason ? ` with reason: "${warnReason}"` : ''}?`,
      () => {
        handleAction('warnPlayer', { targetId: player.id, reason: warnReason || 'No reason' })
        setWarnReason('')
      }
    )
  }

  const handleSlap = () => {
    onConfirm(
      'Slap Player',
      `Slap ${player.name} for ${slapAmount} damage?`,
      () => {
        handleAction('slapPlayer', { targetId: player.id, amount: slapAmount })
      }
    )
  }

  const handleSpectate = () => {
    handleAction('spectatePlayer', { targetId: player.id })
  }

  const handleTeleportTo = () => {
    handleAction('teleportToPlayer', { targetId: player.id })
  }

  const handleTeleportHere = () => {
    handleAction('teleportPlayerToMe', { targetId: player.id })
  }

  const handleToggleFreeze = () => {
    handleAction('toggleFreeze', { targetId: player.id, freeze: !player.frozen })
  }

  const handleToggleMute = () => {
    handleAction('toggleMute', { targetId: player.id, mute: !player.muted })
  }

  const handleScreenshot = () => {
    handleAction('takeScreenshot', { targetId: player.id })
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 16,
      maxWidth: 800,
    }}>
      {/* Player info card */}
      <div style={{
        gridColumn: '1 / -1',
        padding: 20,
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
              {player.name}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              ID: <span className="font-mono">{player.id}</span>
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {player.frozen && <span className="badge badge-red">Frozen</span>}
            {player.muted && <span className="badge badge-orange">Muted</span>}
            {player.developer && <span className="badge badge-purple">Developer</span>}
            {player.contributor && <span className="badge badge-blue">Contributor</span>}
          </div>
        </div>

        <div style={{
          marginTop: 16,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
        }}>
          <InfoBlock label="Identifier" value={player.identifier || 'N/A'} />
          <InfoBlock label="Discord" value={player.discord || 'N/A'} />
          <InfoBlock label="License" value={player.license || 'N/A'} />
        </div>
      </div>

      {/* Quick actions */}
      <ActionCard title="Quick Actions">
        <ActionGrid>
          {permissions['player.spectate'] && (
            <ActionButton
              icon="👁️"
              label="Spectate"
              onClick={handleSpectate}
              disabled={busy}
            />
          )}
          {permissions['player.teleport.single'] && (
            <ActionButton
              icon="📍"
              label="Teleport To"
              onClick={handleTeleportTo}
              disabled={busy}
            />
          )}
          {permissions['player.teleport.single'] && (
            <ActionButton
              icon="↩️"
              label="Teleport Here"
              onClick={handleTeleportHere}
              disabled={busy}
            />
          )}
          {permissions['player.screenshot'] && (
            <ActionButton
              icon="📸"
              label="Screenshot"
              onClick={handleScreenshot}
              disabled={busy}
            />
          )}
          {permissions['player.freeze'] && (
            <ActionButton
              icon={player.frozen ? '🔓' : '❄️'}
              label={player.frozen ? 'Unfreeze' : 'Freeze'}
              onClick={handleToggleFreeze}
              disabled={busy}
              active={player.frozen}
            />
          )}
          {permissions['player.mute'] && (
            <ActionButton
              icon={player.muted ? '🔊' : '🔇'}
              label={player.muted ? 'Unmute' : 'Mute'}
              onClick={handleToggleMute}
              disabled={busy}
              active={player.muted}
            />
          )}
        </ActionGrid>
      </ActionCard>

      {/* Kick */}
      {permissions['player.kick'] && (
        <ActionCard title="Kick">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              className="input"
              placeholder="Reason (optional)"
              value={kickReason}
              onChange={(e) => setKickReason(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleKick()}
            />
            <button
              className="btn btn-warning btn-full"
              onClick={handleKick}
              disabled={busy}
            >
              Kick {player.name}
            </button>
          </div>
        </ActionCard>
      )}

      {/* Ban */}
      {(permissions['player.ban.temporary'] || permissions['player.ban.permanent']) && (
        <ActionCard title="Ban">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              className="input"
              placeholder="Reason (optional)"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
            />
            <select
              className="input"
              value={banDuration}
              onChange={(e) => setBanDuration(Number(e.target.value))}
            >
              {permissions['player.ban.temporary'] && (
                <>
                  <option value={21600}>6 hours</option>
                  <option value={43200}>12 hours</option>
                  <option value={86400}>1 day</option>
                  <option value={259200}>3 days</option>
                  <option value={604800}>1 week</option>
                  <option value={1209600}>2 weeks</option>
                  <option value={2592000}>1 month</option>
                </>
              )}
              {permissions['player.ban.permanent'] && (
                <option value={-1}>Permanent</option>
              )}
            </select>
            <button
              className="btn btn-danger btn-full"
              onClick={handleBan}
              disabled={busy}
            >
              Ban {player.name}
            </button>
          </div>
        </ActionCard>
      )}

      {/* Warn */}
      {permissions['player.warn'] && (
        <ActionCard title="Warn">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              className="input"
              placeholder="Reason (optional)"
              value={warnReason}
              onChange={(e) => setWarnReason(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleWarn()}
            />
            <button
              className="btn btn-warning btn-full"
              onClick={handleWarn}
              disabled={busy}
            >
              Warn {player.name}
            </button>
          </div>
        </ActionCard>
      )}

      {/* Slap */}
      {permissions['player.slap'] && (
        <ActionCard title="Slap">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Damage</span>
              <span className="font-mono" style={{ color: 'var(--accent-orange)' }}>{slapAmount}</span>
            </div>
            <input
              type="range"
              min={10}
              max={500}
              step={10}
              value={slapAmount}
              onChange={(e) => setSlapAmount(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-orange)' }}
            />
            <button
              className="btn btn-warning btn-full"
              onClick={handleSlap}
              disabled={busy}
            >
              Slap {player.name}
            </button>
          </div>
        </ActionCard>
      )}
    </div>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  const displayValue = value.length > 30 ? value.slice(0, 30) + '...' : value
  return (
    <div title={value}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
      <div className="font-mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
        {displayValue}
      </div>
    </div>
  )
}

function ActionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      padding: 16,
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-color)',
    }}>
      <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)' }}>
        {title}
      </h4>
      {children}
    </div>
  )
}

function ActionGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 8,
    }}>
      {children}
    </div>
  )
}

interface ActionButtonProps {
  icon: string
  label: string
  onClick: () => void
  disabled?: boolean
  active?: boolean
}

function ActionButton({ icon, label, onClick, disabled, active }: ActionButtonProps) {
  return (
    <button
      className="btn"
      onClick={onClick}
      disabled={disabled}
      style={{
        flexDirection: 'column',
        padding: '12px 8px',
        gap: 4,
        fontSize: 12,
        background: active ? 'var(--bg-active)' : undefined,
        borderColor: active ? 'var(--accent-blue)' : undefined,
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span>{label}</span>
    </button>
  )
}

function formatDuration(seconds: number): string {
  if (seconds === -1) return 'permanently'
  if (seconds >= 2592000) return `${seconds / 2592000} month(s)`
  if (seconds >= 604800) return `${seconds / 604800} week(s)`
  if (seconds >= 86400) return `${seconds / 86400} day(s)`
  return `${seconds / 3600} hour(s)`
}
