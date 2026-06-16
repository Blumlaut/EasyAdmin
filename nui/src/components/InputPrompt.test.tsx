import { render, screen } from '@testing-library/react'
import { InputPrompt } from './InputPrompt'
import { renderModal, testEscapeCloses } from '../test/renderModal'

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
    const onConfirm = vi.fn()
    const { user } = renderModal(
      <InputPrompt title="Reason" onCancel={() => {}} onConfirm={onConfirm} />,
    )
    await user.type(screen.getByRole('textbox'), 'spam')
    await user.click(screen.getByText('Confirm'))
    expect(onConfirm).toHaveBeenCalledWith('spam')
  })

  it('calls onCancel when cancel is clicked', async () => {
    const onCancel = vi.fn()
    const { user } = renderModal(
      <InputPrompt title="Reason" onCancel={onCancel} onConfirm={() => {}} />,
    )
    await user.click(screen.getByText('Cancel'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('trims whitespace before confirm', async () => {
    const onConfirm = vi.fn()
    const { user } = renderModal(
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
    testEscapeCloses(onCancel)
  })
})
