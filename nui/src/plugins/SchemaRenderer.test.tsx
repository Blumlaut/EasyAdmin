/**
 * SchemaRenderer button payload contract.
 *
 * A button may carry both `data` and a `modal`. The handler has to receive the
 * button's data merged with the form values — dropping `data` silently breaks
 * actions that need context (a player id, most often), and the server then
 * rejects them as invalid parameters.
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ModalProvider } from '../ModalContext'
import { SchemaRenderer } from './SchemaRenderer'
import type { ComponentSchema, ModalButtonConfig } from './schema'

function renderSchema(schema: ComponentSchema[]) {
  const onAction = vi.fn()
  render(
    <ModalProvider>
      <SchemaRenderer schema={schema} onAction={onAction} />
    </ModalProvider>,
  )
  return onAction
}

function modalWith(fields: ModalButtonConfig['fields']): ModalButtonConfig {
  return { title: 'Action', submitLabel: 'Apply', fields }
}

const amountField: ModalButtonConfig['fields'] = [
  { type: 'text', key: 'amount', label: 'Amount' },
]

describe('SchemaRenderer button payloads', () => {
  it('merges a modal button static data with the submitted form values', () => {
    const onAction = renderSchema([
      {
        type: 'button',
        label: 'Add Money',
        action: 'addMoney',
        server: true,
        data: { playerId: 7 },
        modal: modalWith(amountField),
      },
    ])

    fireEvent.click(screen.getByRole('button', { name: /add money/i }))
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '250' } })
    fireEvent.click(screen.getByRole('button', { name: /apply/i }))

    expect(onAction).toHaveBeenCalledWith('addMoney', { playerId: 7, amount: '250' }, true)
  })

  it('lets a form field override a colliding key in the static data', () => {
    const onAction = renderSchema([
      {
        type: 'button',
        label: 'Set Job',
        action: 'setJob',
        data: { grade: 0 },
        modal: modalWith([{ type: 'number', key: 'grade', label: 'Grade', initialValue: 3 }]),
      },
    ])

    fireEvent.click(screen.getByRole('button', { name: /set job/i }))
    fireEvent.click(screen.getByRole('button', { name: /apply/i }))

    expect(onAction).toHaveBeenCalledWith('setJob', { grade: 3 }, false)
  })

  it('sends only the form values when a modal button has no data', () => {
    const onAction = renderSchema([
      { type: 'button', label: 'Warn', action: 'warn', modal: modalWith(amountField) },
    ])

    fireEvent.click(screen.getByRole('button', { name: /warn/i }))
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: 'spam' } })
    fireEvent.click(screen.getByRole('button', { name: /apply/i }))

    expect(onAction).toHaveBeenCalledWith('warn', { amount: 'spam' }, false)
  })

  it('passes static data through unchanged for a button without a modal', () => {
    const onAction = renderSchema([
      { type: 'button', label: 'Revive', action: 'revive', server: true, data: { playerId: 9 } },
    ])

    fireEvent.click(screen.getByRole('button', { name: /revive/i }))

    expect(onAction).toHaveBeenCalledWith('revive', { playerId: 9 }, true)
  })

  it('opens a modal whose fields arrived as an empty object', () => {
    const onAction = renderSchema([
      {
        type: 'button',
        label: 'Confirm',
        action: 'confirm',
        data: { playerId: 3 },
        modal: { title: 'Action', submitLabel: 'Apply', fields: {} as unknown as ModalButtonConfig['fields'] },
      },
    ])

    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))
    fireEvent.click(screen.getByRole('button', { name: /apply/i }))

    expect(onAction).toHaveBeenCalledWith('confirm', { playerId: 3 }, false)
  })
})
