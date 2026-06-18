import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { ModalBuilder } from './modals/ModalBuilder'
import type { ModalDefinition } from './modals/types'

interface ModalContextValue {
  openModal: (definition: ModalDefinition) => void
  closeModal: () => void
}

const ModalContext = createContext<ModalContextValue | null>(null)

export function useModalContext(): ModalContextValue {
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error('useModalContext must be used within ModalProvider')
  return ctx
}

interface ModalProviderProps {
  children: ReactNode
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [modal, setModal] = useState<ModalDefinition | null>(null)

  const closeModal = useCallback(() => setModal(null), [])
  const openModal = useCallback((definition: ModalDefinition) => setModal(definition), [])

  const value = useMemo<ModalContextValue>(() => ({
    openModal,
    closeModal,
  }), [openModal, closeModal])

  return (
    <ModalContext.Provider value={value}>
      {children}
      {modal && renderModal(modal, closeModal)}
    </ModalContext.Provider>
  )
}

function renderModal(definition: ModalDefinition, onCancel: () => void) {
  if (definition.kind === 'custom') {
    return definition.render()
  }

  return (
    <ModalBuilder
      title={definition.title}
      description={definition.description}
      fields={definition.fields}
      submitLabel={definition.submitLabel}
      cancelLabel={definition.cancelLabel}
      submitVariant={definition.submitVariant}
      onCancel={onCancel}
      onSubmit={definition.onSubmit}
    />
  )
}
