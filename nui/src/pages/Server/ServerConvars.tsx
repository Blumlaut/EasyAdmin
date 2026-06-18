import type { Notification } from '../../types'
import { useModalContext } from '../../ModalContext'
import { Icon } from '../../components/icons'
import { callLua } from '../../fivem'
import { runModalAction } from '../../modals/helpers'

interface ServerConvarsProps {
  onToast: (text: string, type?: Notification['type']) => void
}

export function ServerConvars({ onToast }: ServerConvarsProps) {
  const { openModal, closeModal } = useModalContext()

  return (
    <div className="card">
      <p className="section-label">ConVars</p>
      <p className="text-sm text-secondary mb-3">
        Set a convar by name and value.
      </p>
      <button
        className="btn btn-secondary btn-full"
        onClick={() => openModal({
          title: 'Set Convar',
          fields: [
            {
              key: 'name',
              type: 'text',
              label: 'Convar name',
              placeholder: 'sv_hostname',
              required: true,
            },
            {
              key: 'value',
              type: 'text',
              label: 'Value',
              placeholder: 'My Server',
              required: true,
            },
          ],
          onSubmit: async (values) => {
            const name = typeof values.name === 'string' ? values.name.trim() : ''
            const value = typeof values.value === 'string' ? values.value.trim() : ''
            await runModalAction({
              action: () => callLua('setConvar', { name, value }),
              onToast,
              closeModal,
              successMessage: 'Convar set',
              errorMessage: 'Failed to set convar',
            })
          },
        })}
      >
        <Icon name="settings" size="xs" />
        Set convar
      </button>
    </div>
  )
}
