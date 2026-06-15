import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from './ConfirmDialog'

describe('ConfirmDialog', () => {
  it('renders title and message', () => {
    render(
      <ConfirmDialog
        title="Kick Player"
        message="Are you sure you want to kick Alice?"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    )
    expect(screen.getByText('Kick Player')).toBeInTheDocument()
    expect(screen.getByText('Are you sure you want to kick Alice?')).toBeInTheDocument()
  })

  it('calls onCancel when backdrop is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(
      <ConfirmDialog
        title="Test"
        message="Test message"
        onConfirm={() => {}}
        onCancel={onCancel}
      />,
    )
    // Click on the backdrop (outside the dialog)
    await user.click(screen.getByRole('presentation'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('does not cancel when clicking inside the dialog', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(
      <ConfirmDialog
        title="Test"
        message="Test message"
        onConfirm={() => {}}
        onCancel={onCancel}
      />,
    )
    // Click inside the dialog
    await user.click(screen.getByRole('dialog'))
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(
      <ConfirmDialog
        title="Test"
        message="Test message"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />,
    )
    await user.click(screen.getByText('Confirm'))
    expect(onConfirm).toHaveBeenCalled()
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(
      <ConfirmDialog
        title="Test"
        message="Test message"
        onConfirm={() => {}}
        onCancel={onCancel}
      />,
    )
    await user.click(screen.getByText('Cancel'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('closes on Escape key', () => {
    const onCancel = vi.fn()
    render(
      <ConfirmDialog
        title="Test"
        message="Test message"
        onConfirm={() => {}}
        onCancel={onCancel}
      />,
    )
    // Dispatch Escape on window (global listener)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('has proper ARIA attributes', () => {
    render(
      <ConfirmDialog
        title="Kick Player"
        message="Test"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-label', 'Kick Player')
  })
})
