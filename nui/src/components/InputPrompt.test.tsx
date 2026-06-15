import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InputPrompt } from './InputPrompt'

describe('InputPrompt', () => {
  it('renders title', () => {
    render(
      <InputPrompt
        title="Reason"
        label="Why?"
        onCancel={() => {}}
        onConfirm={() => {}}
      />,
    )
    expect(screen.getByText('Reason')).toBeInTheDocument()
    expect(screen.getByText('Why?')).toBeInTheDocument()
  })

  it('calls onConfirm with the entered value', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(
      <InputPrompt title="Reason" onCancel={() => {}} onConfirm={onConfirm} />,
    )
    await user.type(screen.getByRole('textbox'), 'spam')
    await user.click(screen.getByText('Confirm'))
    expect(onConfirm).toHaveBeenCalledWith('spam')
  })

  it('calls onCancel when cancel is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(
      <InputPrompt title="Reason" onCancel={onCancel} onConfirm={() => {}} />,
    )
    await user.click(screen.getByText('Cancel'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('trims whitespace before confirm', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(
      <InputPrompt title="Reason" onCancel={() => {}} onConfirm={onConfirm} />,
    )
    await user.type(screen.getByRole('textbox'), '  hi  ')
    await user.click(screen.getByText('Confirm'))
    expect(onConfirm).toHaveBeenCalledWith('hi')
  })

  it('disables confirm button when required and empty', () => {
    render(
      <InputPrompt
        title="Reason"
        required
        onCancel={() => {}}
        onConfirm={() => {}}
      />,
    )
    expect(screen.getByText('Confirm')).toBeDisabled()
  })

  it('closes on Escape', () => {
    const onCancel = vi.fn()
    render(
      <InputPrompt title="Reason" onCancel={onCancel} onConfirm={() => {}} />,
    )
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(onCancel).toHaveBeenCalled()
  })
})
