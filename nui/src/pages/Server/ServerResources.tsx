import { useModalContext } from '../../ModalContext'
import { Icon } from '../../components/icons'
import { callLua } from '../../fivem'
import { createTextInputModal, getStringValue, runModalAction } from '../../modals/helpers'

export function ServerResources() {
  const { openModal, closeModal } = useModalContext()

  return (
    <div className="card">
      <p className="section-label">Resources</p>
      <div className="flex flex-col gap-2">
        <button
          className="btn btn-primary btn-full"
          onClick={() => openModal(createTextInputModal({
            title: 'Start Resource',
            label: 'Resource name',
            placeholder: 'my-resource',
            required: true,
            onSubmit: async (values) => {
              const name = getStringValue(values, 'value')
              await runModalAction({
                action: () => callLua('startResource', { name }),
                closeModal,
                successMessage: `Starting ${name}`,
                errorMessage: 'Failed to start resource',
              })
            },
          }))}
        >
          <Icon name="plus" size="xs" />
          Start resource
        </button>
        <button
          className="btn btn-warning btn-full"
          onClick={() => openModal(createTextInputModal({
            title: 'Stop Resource',
            label: 'Resource name',
            placeholder: 'my-resource',
            required: true,
            submitVariant: 'warning',
            onSubmit: async (values) => {
              const name = getStringValue(values, 'value')
              await runModalAction({
                action: () => callLua('stopResource', { name }),
                closeModal,
                successMessage: `Stopping ${name}`,
                errorMessage: 'Failed to stop resource',
              })
            },
          }))}
        >
          <Icon name="x" size="xs" />
          Stop resource
        </button>
      </div>
    </div>
  )
}
