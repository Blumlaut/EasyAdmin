import type { Notification } from '../types'
import type { ModalDefinition, ModalValues } from './types'
import { createBanModal as createBanModalImpl } from './BanModal'

// Re-export createBanModal from BanModal (custom modal with date/time picker)
export const createBanModal = createBanModalImpl

export function getStringValue(values: ModalValues, key: string): string {
  const value = values[key]
  return typeof value === 'string' ? value.trim() : ''
}

export function getNumberValue(values: ModalValues, key: string): number | null {
  const value = values[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function getBooleanValue(values: ModalValues, key: string): boolean {
  return values[key] === true
}

export function createConfirmModal(options: {
  title: string
  description: string
  submitLabel?: string
  submitVariant?: 'primary' | 'danger' | 'warning' | 'success' | 'secondary'
  onSubmit: () => Promise<void> | void
}): ModalDefinition {
  return {
    title: options.title,
    description: options.description,
    submitLabel: options.submitLabel,
    submitVariant: options.submitVariant,
    onSubmit: options.onSubmit,
  }
}

export function createTextInputModal(options: {
  title: string
  label: string
  placeholder?: string
  initialValue?: string
  maxLength?: number
  required?: boolean
  submitLabel?: string
  submitVariant?: 'primary' | 'danger' | 'warning' | 'success' | 'secondary'
  onSubmit: (values: ModalValues) => Promise<void> | void
}): ModalDefinition {
  return {
    title: options.title,
    submitLabel: options.submitLabel,
    submitVariant: options.submitVariant,
    fields: [
      {
        key: 'value',
        type: 'text',
        label: options.label,
        placeholder: options.placeholder,
        initialValue: options.initialValue,
        maxLength: options.maxLength,
        required: options.required,
      },
    ],
    onSubmit: options.onSubmit,
  }
}

export function createTextAreaModal(options: {
  title: string
  label: string
  placeholder?: string
  initialValue?: string
  maxLength?: number
  required?: boolean
  submitLabel?: string
  submitVariant?: 'primary' | 'danger' | 'warning' | 'success' | 'secondary'
  onSubmit: (values: ModalValues) => Promise<void> | void
}): ModalDefinition {
  return {
    title: options.title,
    submitLabel: options.submitLabel,
    submitVariant: options.submitVariant,
    fields: [
      {
        key: 'value',
        type: 'textarea',
        label: options.label,
        placeholder: options.placeholder,
        initialValue: options.initialValue,
        maxLength: options.maxLength,
        required: options.required,
      },
    ],
    onSubmit: options.onSubmit,
  }
}

export async function runModalAction(options: {
  action: () => Promise<void>
  onToast: (text: string, type?: Notification['type']) => void
  closeModal: () => void
  successMessage?: string
  errorMessage: string
  onSuccess?: () => void
}) {
  try {
    await options.action()
    if (options.successMessage) {
      options.onToast(options.successMessage, 'success')
    }
    options.onSuccess?.()
  } catch {
    options.onToast(options.errorMessage, 'error')
  } finally {
    options.closeModal()
  }
}
