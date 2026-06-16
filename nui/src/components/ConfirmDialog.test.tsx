import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from './ConfirmDialog'
import { renderModal, testEscapeCloses, testDialogAria } from '../test/renderModal'

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
    const onCancel = vi.fn()
    const { user } = renderModal(
      <ConfirmDialog
        title="Test"
        message="Test message"
        onConfirm={() => {}}
        onCancel={onCancel}
      />,
    )
    await user.click(screen.getByRole('presentation'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('does not cancel when clicking inside the dialog', async () => {
    const onCancel = vi.fn()
    const { user } = renderModal(
      <ConfirmDialog
        title="Test"
        message="Test message"
        onConfirm={() => {}}
        onCancel={onCancel}
      />,
    )
    await user.click(screen.getByRole('dialog'))
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('calls onConfirm when confirm button is clicked', async () => {
    const onConfirm = vi.fn()
    const { user } = renderModal(
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
    const onCancel = vi.fn()
    const { user } = renderModal(
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
    testEscapeCloses(onCancel)
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
    testDialogAria('dialog-title')
  })
})
