import { createContext, useContext, useRef, useState, useCallback, type ReactNode } from 'react'
import { useFocusTrap } from './hooks/useFocusTrap'
import type { CleanupRadius, CleanupType, Notification, Player } from './types'
import { callLua } from './fivem'
import { InputPrompt } from './components/InputPrompt'
import { TwoFieldPrompt } from './components/TwoFieldPrompt'
import { CleanupModal } from './components/CleanupModal'
import { ConfirmDialog } from './components/ConfirmDialog'
import { SliderInput } from './components/SliderInput'
import { BanDurationPicker } from './components/BanDurationPicker'

// ---- Modal state types ----

type ModalKind =
  | null
  | 'announcement'
  | 'set-gametype'
  | 'set-mapname'
  | 'convar'
  | 'cleanup'
  | 'resource-start'
  | 'resource-stop'
  | { kind: 'kick'; player: Player }
  | { kind: 'warn'; player: Player }
  | { kind: 'ban'; player: Player }
  | { kind: 'slap'; player: Player }
  | { kind: 'confirm'; title: string; message: string; variant?: 'default' | 'danger'; action: () => Promise<void> }
  | { kind: 'offline-ban'; id: number; name: string }

interface ModalContextValue {
  openAnnouncement: () => void
  openGametype: () => void
  openMapName: () => void
  openConvar: () => void
  openCleanup: (types: CleanupType[]) => void
  openResourceStart: () => void
  openResourceStop: () => void
  openKick: (player: Player) => void
  openWarn: (player: Player) => void
  openBan: (player: Player) => void
  openSlap: (player: Player) => void
  openConfirm: (title: string, message: string, action: () => Promise<void>, variant?: 'default' | 'danger') => void
  openOfflineBan: (id: number, name: string) => void
  closeAll: () => void
}

const ModalContext = createContext<ModalContextValue | null>(null)

export function useModalContext(): ModalContextValue {
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error('useModalContext must be used within ModalProvider')
  return ctx
}

interface ModalProviderProps {
  children: ReactNode
  cleanupTypes: CleanupType[]
  onToast: (text: string, type?: Notification['type']) => void
  onPlayersUpdated?: () => void
}

export function ModalProvider({
  children,
  cleanupTypes,
  onToast,
  onPlayersUpdated,
}: ModalProviderProps) {
  const [modal, setModal] = useState<ModalKind>(null)

  const closeAll = useCallback(() => setModal(null), [])

  const openAnnouncement = useCallback(() => setModal('announcement'), [])
  const openGametype = useCallback(() => setModal('set-gametype'), [])
  const openMapName = useCallback(() => setModal('set-mapname'), [])
  const openConvar = useCallback(() => setModal('convar'), [])
  const openCleanup = useCallback((_types: CleanupType[]) => setModal('cleanup'), [])
  const openResourceStart = useCallback(() => setModal('resource-start'), [])
  const openResourceStop = useCallback(() => setModal('resource-stop'), [])
  const openKick = useCallback((player: Player) => setModal({ kind: 'kick', player }), [])
  const openWarn = useCallback((player: Player) => setModal({ kind: 'warn', player }), [])
  const openBan = useCallback((player: Player) => setModal({ kind: 'ban', player }), [])
  const openSlap = useCallback((player: Player) => setModal({ kind: 'slap', player }), [])
  const openConfirm = useCallback((title: string, message: string, action: () => Promise<void>, variant?: 'default' | 'danger') => {
    setModal({ kind: 'confirm', title, message, variant, action })
  }, [])
  const openOfflineBan = useCallback((id: number, name: string) => setModal({ kind: 'offline-ban', id, name }), [])

  // ---- Action helpers ----

  async function sendAnnouncement(msg: string) {
    try {
      await callLua('announce', { message: msg })
      onToast('Announcement sent', 'success')
    } catch {
      onToast('Failed to send announcement', 'error')
    }
    closeAll()
  }

  async function setGametype(value: string) {
    try {
      await callLua('setGametype', { value })
      onToast('Gametype updated', 'success')
    } catch {
      onToast('Failed to set gametype', 'error')
    }
    closeAll()
  }

  async function setMapName(value: string) {
    try {
      await callLua('setMapName', { value })
      onToast('Map name updated', 'success')
    } catch {
      onToast('Failed to set map name', 'error')
    }
    closeAll()
  }

  async function setConvar(name: string, value: string) {
    try {
      await callLua('setConvar', { name, value })
      onToast('Convar set', 'success')
    } catch {
      onToast('Failed to set convar', 'error')
    }
    closeAll()
  }

  async function doCleanup(type: CleanupType, radius: CleanupRadius, deep: boolean) {
    try {
      await callLua('requestCleanup', { type, radius, deep })
      onToast('Cleanup executed', 'success')
    } catch {
      onToast('Cleanup failed', 'error')
    }
    closeAll()
  }

  async function startResource(name: string) {
    try {
      await callLua('startResource', { name })
      onToast(`Starting ${name}`, 'success')
    } catch {
      onToast('Failed to start resource', 'error')
    }
    closeAll()
  }

  async function stopResource(name: string) {
    try {
      await callLua('stopResource', { name })
      onToast(`Stopping ${name}`, 'success')
    } catch {
      onToast('Failed to stop resource', 'error')
    }
    closeAll()
  }

  async function kickPlayer(player: Player, reason: string) {
    try {
      await callLua('kickPlayer', { id: player.id, name: player.name, reason })
      onToast(`Kicked ${player.name}`, 'success')
      onPlayersUpdated?.()
    } catch {
      onToast('Kick failed', 'error')
    }
    closeAll()
  }

  async function warnPlayer(player: Player, reason: string) {
    try {
      await callLua('warnPlayer', { id: player.id, name: player.name, reason })
      onToast(`Warned ${player.name}`, 'success')
    } catch {
      onToast('Warn failed', 'error')
    }
    closeAll()
  }

  async function slapPlayer(player: Player, amount: number) {
    try {
      await callLua('slapPlayer', { id: player.id, name: player.name, amount })
      onToast('Slapped', 'success')
    } catch {
      onToast('Slap failed', 'error')
    }
    closeAll()
  }

  // ---- Context value ----

  const value: ModalContextValue = {
    openAnnouncement,
    openGametype,
    openMapName,
    openConvar,
    openCleanup,
    openResourceStart,
    openResourceStop,
    openKick,
    openWarn,
    openBan,
    openSlap,
    openConfirm,
    openOfflineBan,
    closeAll,
  }

  return (
    <ModalContext.Provider value={value}>
      {children}
      {renderModals()}
    </ModalContext.Provider>
  )

  // ---- Modal rendering (sibling of children, NOT inside .ea-window) ----

  function renderModals() {
    // Simple string modals
    if (modal === 'announcement') {
      return (
        <InputPrompt
          title="Server Announcement"
          label="Message to broadcast"
          placeholder="Server restart in 5 minutes"
          maxLength={200}
          onCancel={closeAll}
          onConfirm={sendAnnouncement}
        />
      )
    }

    if (modal === 'set-gametype') {
      return (
        <InputPrompt
          title="Set Gametype"
          label="Gametype"
          placeholder="Roleplay"
          onCancel={closeAll}
          onConfirm={setGametype}
        />
      )
    }

    if (modal === 'set-mapname') {
      return (
        <InputPrompt
          title="Set Map Name"
          label="Map name"
          placeholder="Chaos Island"
          onCancel={closeAll}
          onConfirm={setMapName}
        />
      )
    }

    if (modal === 'convar') {
      return (
        <TwoFieldPrompt
          title="Set Convar"
          firstLabel="Convar name"
          firstPlaceholder="sv_hostname"
          secondLabel="Value"
          secondPlaceholder="My Server"
          onCancel={closeAll}
          onConfirm={setConvar}
        />
      )
    }

    if (modal === 'cleanup') {
      return (
        <CleanupModal
          availableTypes={cleanupTypes}
          onConfirm={doCleanup}
          onCancel={closeAll}
        />
      )
    }

    if (modal === 'resource-start') {
      return (
        <InputPrompt
          title="Start Resource"
          label="Resource name"
          placeholder="my-resource"
          onCancel={closeAll}
          onConfirm={startResource}
        />
      )
    }

    if (modal === 'resource-stop') {
      return (
        <InputPrompt
          title="Stop Resource"
          label="Resource name"
          placeholder="my-resource"
          onCancel={closeAll}
          onConfirm={stopResource}
        />
      )
    }

    if (modal === null) return null

    // Confirm dialog
    if (modal.kind === 'confirm') {
      return (
        <ConfirmDialog
          title={modal.title}
          message={modal.message}
          variant={modal.variant}
          onConfirm={async () => {
            await modal.action()
            closeAll()
          }}
          onCancel={closeAll}
        />
      )
    }

    // Kick
    if (modal.kind === 'kick') {
      return (
        <InputPrompt
          title={`Kick ${modal.player.name}`}
          label="Kick reason"
          placeholder="No reason"
          onCancel={closeAll}
          onConfirm={(v) => kickPlayer(modal.player, v || 'No reason')}
        />
      )
    }

    // Warn
    if (modal.kind === 'warn') {
      return (
        <InputPrompt
          title={`Warn ${modal.player.name}`}
          label="Warn reason"
          placeholder="No reason"
          onCancel={closeAll}
          onConfirm={(v) => warnPlayer(modal.player, v || 'No reason')}
        />
      )
    }

    // Slap
    if (modal.kind === 'slap') {
      return (
        <SliderInput
          label="Slap player"
          min={1}
          max={20}
          initialValue={5}
          formatValue={(n) => `${n * 10} damage`}
          onCancel={closeAll}
          onConfirm={(n) => slapPlayer(modal.player, n * 10)}
        />
      )
    }

    // Ban (multi-step flow)
    if (modal.kind === 'ban') {
      return <BanFlow player={modal.player} />
    }

    // Offline ban (cached players)
    if (modal.kind === 'offline-ban') {
      return <OfflineBanFlow id={modal.id} name={modal.name} />
    }

    return null
  }
}

// ---- Ban flow: reason → duration → confirm ----

function BanFlow({ player }: { player: Player }) {
  const [reason, setReason] = useState<string | null>(null)
  const ctx = useModalContext()

  if (reason === null) {
    return (
      <InputPrompt
        title={`Ban ${player.name}`}
        label="Ban reason"
        placeholder="No reason"
        onCancel={ctx.closeAll}
        onConfirm={(v) => setReason(v || 'No reason')}
      />
    )
  }

  return (
    <BanDurationFlow
      onBack={() => setReason(null)}
      onCancel={ctx.closeAll}
      onConfirm={async (seconds) => {
        if (seconds !== null && seconds !== -1) {
          try {
            await callLua('banPlayer', { id: player.id, name: player.name, reason, duration: seconds })
          } catch { /* handled below */ }
        }
        ctx.closeAll()
      }}
    />
  )
}

function BanDurationFlow({
  onBack,
  onCancel,
  onConfirm,
}: {
  onBack: () => void
  onCancel: () => void
  onConfirm: (seconds: number | null) => void
}) {
  const [duration, setDuration] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useFocusTrap(containerRef)

  return (
    <div
      ref={containerRef}
      className="dialog-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="ban-flow-title">
        <h2 id="ban-flow-title" className="dialog-title">Ban duration</h2>
        <p className="dialog-description">Choose how long the ban should last.</p>
        <BanDurationPicker value={duration} onChange={setDuration} />
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onBack}>Back</button>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button
            className="btn btn-danger"
            disabled={duration === null || duration === -1}
            onClick={() => onConfirm(duration)}
          >
            Confirm ban
          </button>
        </div>
      </div>
    </div>
  )
}

// ---- Offline ban flow (cached players): reason → duration → confirm ----

function OfflineBanFlow({ id, name }: { id: number; name: string }) {
  const [reason, setReason] = useState<string | null>(null)
  const ctx = useModalContext()

  if (reason === null) {
    return (
      <InputPrompt
        title={`Ban ${name}`}
        label="Ban reason"
        placeholder="No reason"
        onCancel={ctx.closeAll}
        onConfirm={(v) => setReason(v || 'No reason')}
      />
    )
  }

  return (
    <OfflineBanDurationFlow
      id={id}
      name={name}
      reason={reason}
      onCancel={ctx.closeAll}
    />
  )
}

function OfflineBanDurationFlow({
  id,
  name,
  reason,
  onCancel,
}: {
  id: number
  name: string
  reason: string
  onCancel: () => void
}) {
  const [duration, setDuration] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const ctx = useModalContext()

  useFocusTrap(containerRef)

  return (
    <div
      ref={containerRef}
      className="dialog-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="offline-ban-title">
        <h2 id="offline-ban-title" className="dialog-title">Ban duration</h2>
        <p className="dialog-description">Choose how long the ban should last.</p>
        <BanDurationPicker value={duration} onChange={setDuration} />
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button
            className="btn btn-danger"
            disabled={duration === null || duration === -1}
            onClick={async () => {
              if (duration !== null && duration !== -1) {
                try {
                  await callLua('offlineBanPlayer', { id, name, reason, duration })
                } catch { /* handled below */ }
              }
              onCancel()
              ctx.closeAll()
            }}
          >
            Confirm ban
          </button>
        </div>
      </div>
    </div>
  )
}
