import type { ReactNode } from 'react'

export type ModalValue = string | number | boolean | null
export type ModalValues = Record<string, ModalValue>

interface BaseFieldDefinition {
  key: string
  label?: string
  description?: string
  required?: boolean
}

export interface TextFieldDefinition extends BaseFieldDefinition {
  type: 'text'
  placeholder?: string
  initialValue?: string
  maxLength?: number
  inputType?: 'text' | 'password'
}

export interface TextAreaFieldDefinition extends BaseFieldDefinition {
  type: 'textarea'
  placeholder?: string
  initialValue?: string
  maxLength?: number
  rows?: number
}

export interface NumberFieldDefinition extends BaseFieldDefinition {
  type: 'number'
  placeholder?: string
  initialValue?: number
  min?: number
  max?: number
  step?: number
}

export interface SliderFieldDefinition extends BaseFieldDefinition {
  type: 'slider'
  initialValue?: number
  min: number
  max: number
  step?: number
  formatValue?: (value: number) => ReactNode
}

export interface SelectFieldDefinition extends BaseFieldDefinition {
  type: 'select'
  initialValue?: string
  placeholder?: string
  options: Array<{
    value: string
    label: string
  }>
}

export interface CheckboxFieldDefinition extends BaseFieldDefinition {
  type: 'checkbox'
  initialValue?: boolean
}

export type ModalFieldDefinition =
  | TextFieldDefinition
  | TextAreaFieldDefinition
  | NumberFieldDefinition
  | SliderFieldDefinition
  | SelectFieldDefinition
  | CheckboxFieldDefinition

export interface FormModalDefinition {
  kind?: 'form'
  title: string
  description?: ReactNode
  fields?: ModalFieldDefinition[]
  submitLabel?: string
  cancelLabel?: string
  submitVariant?: 'primary' | 'danger' | 'warning' | 'success' | 'secondary'
  onSubmit: (values: ModalValues) => Promise<void> | void
}

export interface CustomModalDefinition {
  kind: 'custom'
  render: () => ReactNode
}

export type ModalDefinition = FormModalDefinition | CustomModalDefinition
