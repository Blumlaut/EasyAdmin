import type { Notification } from '../../types'
import { useModalContext } from '../../ModalContext'
import { Icon } from '../../components/icons'
import { callLua } from '../../fivem'
import { createTextInputModal, getStringValue, runModalAction } from '../../modals/helpers'

interface ServerInfoProps {
  onToast: (text: string, type?: Notification['type']) => void
}

export function ServerInfo({ onToast }: ServerInfoProps) {
  const { openModal, closeModal } = useModalContext()

  return (
    <div className="card">
      <p className="section-label">Server Info</p>
      <div className="flex flex-col gap-1">
        <button
          className="server-action-btn"
          onClick={() => openModal(createTextInputModal({
            title: 'Set Gametype',
            label: 'Gametype',
            placeholder: 'Roleplay',
            required: true,
            onSubmit: async (values) => {
              const value = getStringValue(values, 'value')
              await runModalAction({
                action: () => callLua('setGametype', { value }),
                onToast,
                closeModal,
                successMessage: 'Gametype updated',
                errorMessage: 'Failed to set gametype',
              })
            },
          }))}
        >
          <Icon name="server" size="xs" className="text-muted" />
          <span className="flex-1 text-left">Set gametype</span>
          <Icon name="chevron-right" size="xs" className="text-muted opacity-subtle" />
        </button>
        <button
          className="server-action-btn"
          onClick={() => openModal(createTextInputModal({
            title: 'Set Map Name',
            label: 'Map name',
            placeholder: 'Chaos Island',
            required: true,
            onSubmit: async (values) => {
              const value = getStringValue(values, 'value')
              await runModalAction({
                action: () => callLua('setMapName', { value }),
                onToast,
                closeModal,
                successMessage: 'Map name updated',
                errorMessage: 'Failed to set map name',
              })
            },
          }))}
        >
          <Icon name="map-pin" size="xs" className="text-muted" />
          <span className="flex-1 text-left">Set map name</span>
          <Icon name="chevron-right" size="xs" className="text-muted opacity-subtle" />
        </button>
      </div>
    </div>
  )
}
