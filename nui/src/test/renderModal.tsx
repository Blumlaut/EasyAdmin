import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'

/**
 * Render a modal component and return common test utilities.
 *
 * Eliminates repeated render + userEvent setup across modal tests.
 */
export function renderModal(ui: ReactNode) {
  const user = userEvent.setup()
  const base = render(ui)

  return {
    user,
    ...base,
    getDialog: () => screen.getByRole('dialog'),
    getBackdrop: () => screen.getByRole('presentation'),
  }
}

/**
 * Assert that a modal closes on Escape key.
 */
export function testEscapeCloses(onCancel: ReturnType<Vi.fn>) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
  expect(onCancel).toHaveBeenCalled()
}

/**
 * Assert that a modal has standard ARIA attributes.
 */
export function testDialogAria(titleId: string) {
  const dialog = screen.getByRole('dialog')
  expect(dialog).toHaveAttribute('aria-modal', 'true')
  expect(dialog).toHaveAttribute('aria-labelledby', titleId)
}
