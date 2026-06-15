import { useState } from 'react'
import { callLua } from '../../fivem'
import type { Notification } from '../../types'
import { InputPrompt } from '../../components/InputPrompt'
import { Icon } from '../../components/icons'

interface ServerInfoProps {
  onToast: (text: string, type?: Notification['type']) => void
}

type EditingField = 'gametype' | 'mapname' | null

export function ServerInfo({ onToast }: ServerInfoProps) {
  const [editing, setEditing] = useState<EditingField>(null)

  async function commit(field: Exclude<EditingField, null>, value: string) {
    const cb = field === 'gametype' ? 'setGameType' : 'setMapName'
    try {
      await callLua(cb, { value })
      onToast(`${field === 'gametype' ? 'Gametype' : 'Map name'} updated`, 'success')
    } catch {
      onToast('Update failed', 'error')
    } finally {
      setEditing(null)
    }
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-3">Server Info</h3>
      <div className="flex flex-col gap-2">
        <button
          className="btn btn-secondary"
          onClick={() => setEditing('gametype')}
        >
          <Icon name="server" size="xs" />
          Set gametype
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => setEditing('mapname')}
        >
          <Icon name="map-pin" size="xs" />
          Set map name
        </button>
      </div>
      {editing === 'gametype' && (
        <InputPrompt
          title="Set gametype"
          label="New gametype"
          placeholder="freeroam"
          maxLength={32}
          onCancel={() => setEditing(null)}
          onConfirm={(v) => commit('gametype', v)}
        />
      )}
      {editing === 'mapname' && (
        <InputPrompt
          title="Set map name"
          label="New map name"
          placeholder="Los Santos"
          maxLength={32}
          onCancel={() => setEditing(null)}
          onConfirm={(v) => commit('mapname', v)}
        />
      )}
    </div>
  )
}
