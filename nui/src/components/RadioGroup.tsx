import React, { type ReactNode } from 'react'

export interface RadioOption<T = string> {
  value: T
  label: string
  description?: string
}

export interface RadioGroupProps<T = string> {
  name: string
  options: RadioOption<T>[]
  value: T
  onChange: (value: T) => void
  /** Render children between options (e.g. dividers, help text) */
  children?: ReactNode
}

export function RadioGroup<T = string>({
  name,
  options,
  value,
  onChange,
  children,
}: RadioGroupProps<T>) {
  return (
    <fieldset className="radio-group">
      <legend className="sr-only">{name}</legend>
      <div className="radio-group-options">
        {options.map((option, i) => (
          <React.Fragment key={String(option.value)}>
            <label
              className={`radio-group-option ${value === option.value ? 'radio-group-option--checked' : ''}`}
              role="radio"
              aria-checked={value === option.value}
            >
              <input
                type="radio"
                name={name}
                value={String(option.value)}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                className="radio-group-input"
                tabIndex={value === option.value ? 0 : -1}
              />
              <span className="radio-group-radio" />
              <span className="radio-group-content">
                <span className="radio-group-label">{option.label}</span>
                {option.description && (
                  <span className="radio-group-description">{option.description}</span>
                )}
              </span>
            </label>
            {children && i < options.length - 1 ? null : null}
          </React.Fragment>
        ))}
        {children}
      </div>
    </fieldset>
  )
}
