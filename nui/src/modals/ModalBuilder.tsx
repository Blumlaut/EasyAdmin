import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import type { ModalFieldDefinition, ModalValue, ModalValues, SelectFieldDefinition, SliderFieldDefinition } from './types'
import { DialogWrapper } from '../components/DialogWrapper'
import { useEscapeKey } from '../hooks/useEscapeKey'

interface ModalBuilderProps {
  title: string
  description?: ReactNode
  fields?: ModalFieldDefinition[]
  submitLabel?: string
  cancelLabel?: string
  submitVariant?: 'primary' | 'danger' | 'warning' | 'success' | 'secondary'
  onSubmit: (values: ModalValues) => Promise<void> | void
  onCancel: () => void
}

function getInitialValue(field: ModalFieldDefinition): ModalValue {
  switch (field.type) {
    case 'text':
    case 'textarea':
      return field.initialValue ?? ''
    case 'number':
      return field.initialValue ?? null
    case 'slider':
      return field.initialValue ?? field.min
    case 'select':
      return field.initialValue ?? ''
    case 'checkbox':
      return field.initialValue ?? false
  }
}

function normalizeTextValue(value: ModalValue): string {
  return typeof value === 'string' ? value : ''
}

function normalizeNumberValue(value: ModalValue): string {
  return typeof value === 'number' ? String(value) : ''
}

function validateField(field: ModalFieldDefinition, value: ModalValue): boolean {
  if (!field.required) return true

  switch (field.type) {
    case 'text':
    case 'textarea':
    case 'select':
      return typeof value === 'string' && value.trim().length > 0
    case 'number':
    case 'slider':
      return typeof value === 'number' && Number.isFinite(value)
    case 'checkbox':
      return value === true
  }
}

function getSubmitButtonClass(variant: ModalBuilderProps['submitVariant']) {
  switch (variant) {
    case 'danger':
      return 'btn btn-danger'
    case 'warning':
      return 'btn btn-warning'
    case 'success':
      return 'btn btn-success'
    case 'secondary':
      return 'btn btn-secondary'
    default:
      return 'btn btn-primary'
  }
}

export function ModalBuilder({
  title,
  description,
  fields = [],
  submitLabel = 'Confirm',
  cancelLabel = 'Cancel',
  submitVariant = 'primary',
  onSubmit,
  onCancel,
}: ModalBuilderProps) {
  const [values, setValues] = useState<ModalValues>(() =>
    Object.fromEntries(fields.map((field) => [field.key, getInitialValue(field)])),
  )
  const [submitting, setSubmitting] = useState(false)
  const firstInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null)

  useEscapeKey(onCancel)

  useEffect(() => {
    firstInputRef.current?.focus()
    if (firstInputRef.current instanceof HTMLInputElement || firstInputRef.current instanceof HTMLTextAreaElement) {
      firstInputRef.current.select()
    }
  }, [])

  const isValid = useMemo(
    () => fields.every((field) => validateField(field, values[field.key])),
    [fields, values],
  )

  async function handleSubmit() {
    if (!isValid || submitting) return
    setSubmitting(true)
    try {
      await onSubmit(values)
    } finally {
      setSubmitting(false)
    }
  }

  function setFieldValue(key: string, value: ModalValue) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function renderField(field: ModalFieldDefinition, index: number) {
    const commonRef = index === 0 ? firstInputRef : undefined
    const value = values[field.key]

    switch (field.type) {
      case 'text':
        return (
          <label key={field.key} className="flex flex-col gap-1">
            {field.label && <span className="text-sm text-secondary">{field.label}</span>}
            <input
              ref={commonRef as RefObject<HTMLInputElement>}
              className="input"
              type={field.inputType ?? 'text'}
              placeholder={field.placeholder}
              value={normalizeTextValue(value)}
              maxLength={field.maxLength}
              onChange={(e) => setFieldValue(field.key, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              aria-label={field.label ?? field.key}
            />
            {field.description && <span className="text-xs text-muted">{field.description}</span>}
          </label>
        )
      case 'textarea':
        return (
          <label key={field.key} className="flex flex-col gap-1">
            {field.label && <span className="text-sm text-secondary">{field.label}</span>}
            <textarea
              ref={commonRef as RefObject<HTMLTextAreaElement>}
              className="input"
              placeholder={field.placeholder}
              value={normalizeTextValue(value)}
              maxLength={field.maxLength}
              rows={field.rows ?? 4}
              onChange={(e) => setFieldValue(field.key, e.target.value)}
              aria-label={field.label ?? field.key}
            />
            {field.description && <span className="text-xs text-muted">{field.description}</span>}
          </label>
        )
      case 'number':
        return (
          <label key={field.key} className="flex flex-col gap-1">
            {field.label && <span className="text-sm text-secondary">{field.label}</span>}
            <input
              ref={commonRef as RefObject<HTMLInputElement>}
              className="input"
              type="number"
              placeholder={field.placeholder}
              value={normalizeNumberValue(value)}
              min={field.min}
              max={field.max}
              step={field.step}
              onChange={(e) => {
                const raw = e.target.value
                setFieldValue(field.key, raw === '' ? null : Number(raw))
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              aria-label={field.label ?? field.key}
            />
            {field.description && <span className="text-xs text-muted">{field.description}</span>}
          </label>
        )
      case 'slider':
        return (
          <SliderField
            key={field.key}
            field={field}
            value={typeof value === 'number' ? value : field.min}
            inputRef={commonRef as RefObject<HTMLInputElement> | undefined}
            onChange={(nextValue) => setFieldValue(field.key, nextValue)}
          />
        )
      case 'select':
        return (
          <SelectField
            key={field.key}
            field={field}
            value={normalizeTextValue(value)}
            inputRef={commonRef as RefObject<HTMLSelectElement> | undefined}
            onChange={(nextValue) => setFieldValue(field.key, nextValue)}
          />
        )
      case 'checkbox':
        return (
          <div key={field.key} className="toggle-row">
            <div className="flex flex-col gap-1">
              {field.label && <span className="text-sm text-secondary">{field.label}</span>}
              {field.description && <span className="text-xs text-muted">{field.description}</span>}
            </div>
            <label className="toggle">
              <input
                ref={commonRef as RefObject<HTMLInputElement>}
                type="checkbox"
                checked={value === true}
                onChange={(e) => setFieldValue(field.key, e.target.checked)}
                aria-label={field.label ?? field.key}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        )
    }
  }

  return (
    <DialogWrapper
      title={title}
      description={description}
      onCancel={onCancel}
      actions={
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
            {cancelLabel}
          </button>
          <button
            className={getSubmitButtonClass(submitVariant)}
            onClick={() => { void handleSubmit() }}
            disabled={!isValid || submitting}
          >
            {submitting ? 'Working...' : submitLabel}
          </button>
        </div>
      }
    >
      {fields.length > 0 && (
        <div className="flex flex-col gap-3">
          {fields.map(renderField)}
        </div>
      )}
    </DialogWrapper>
  )
}

function SliderField({
  field,
  value,
  inputRef,
  onChange,
}: {
  field: SliderFieldDefinition
  value: number
  inputRef?: RefObject<HTMLInputElement>
  onChange: (value: number) => void
}) {
  return (
    <label className="flex flex-col gap-2">
      {field.label && <span className="text-sm text-secondary">{field.label}</span>}
      <span>
        Value: <span className="text-mono font-semibold">{field.formatValue ? field.formatValue(value) : value}</span>
      </span>
      <input
        ref={inputRef}
        className="slider"
        type="range"
        min={field.min}
        max={field.max}
        step={field.step ?? 1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={field.label ?? field.key}
      />
      {field.description && <span className="text-xs text-muted">{field.description}</span>}
    </label>
  )
}

function SelectField({
  field,
  value,
  inputRef,
  onChange,
}: {
  field: SelectFieldDefinition
  value: string
  inputRef?: RefObject<HTMLSelectElement>
  onChange: (value: string) => void
}) {
  return (
    <label className="flex flex-col gap-1">
      {field.label && <span className="text-sm text-secondary">{field.label}</span>}
      <select
        ref={inputRef}
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={field.label ?? field.key}
      >
        {field.placeholder && (
          <option value="" disabled>
            {field.placeholder}
          </option>
        )}
        {field.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {field.description && <span className="text-xs text-muted">{field.description}</span>}
    </label>
  )
}
