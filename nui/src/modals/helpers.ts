import type { Notification } from '../types'
import type { ModalDefinition, ModalValues } from './types'

export const BAN_DURATION_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '21600', label: '6 hours' },
  { value: '43200', label: '12 hours' },
  { value: '86400', label: '1 day' },
  { value: '259200', label: '3 days' },
  { value: '518400', label: '1 week' },
  { value: '1123200', label: '2 weeks' },
  { value: '2678400', label: '1 month' },
  { value: '31536000', label: '1 year' },
  { value: '10444633200', label: 'Permanent' },
  { value: '-1', label: 'Custom...' },
]

export function createBanModal(options: {
  title: string
  onSubmit: (reason: string, duration: number) => Promise<void> | void
}): ModalDefinition {
  return {
    kind: 'form',
    title: options.title,
    submitLabel: 'Ban',
    submitVariant: 'danger',
    fields: [
      {
        key: 'reason',
        type: 'text' as const,
        label: 'Reason',
        placeholder: 'No reason',
        required: true,
      },
      {
        key: 'duration',
        type: 'select' as const,
        label: 'Duration',
        placeholder: 'Select duration...',
        options: BAN_DURATION_OPTIONS,
        required: true,
      },
    ],
    onSubmit: async (values) => {
      const reason = typeof values.reason === 'string' ? values.reason.trim() : 'No reason'
      const durationRaw = typeof values.duration === 'string' ? values.duration : ''
      const duration = Number(durationRaw)
      if (duration === -1) {
        // TODO: implement custom ban duration picker
        return
      }
      await options.onSubmit(reason, duration)
    },
  }
}

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
