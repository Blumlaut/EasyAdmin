import { render, screen } from '@testing-library/react'
import { Toast } from './Toast'

describe('Toast', () => {
  it('renders the message', () => {
    render(<Toast message="Player kicked" />)
    expect(screen.getByText('Player kicked')).toBeInTheDocument()
  })

  it('applies info class by default', () => {
    render(<Toast message="Info message" />)
    const toast = screen.getByText('Info message').closest('div.toast')
    expect(toast).toHaveClass('toast-info')
  })

  it('applies success class', () => {
    render(<Toast message="Success" type="success" />)
    const toast = screen.getByText('Success').closest('div.toast')
    expect(toast).toHaveClass('toast-success')
  })

  it('applies error class', () => {
    render(<Toast message="Error" type="error" />)
    const toast = screen.getByText('Error').closest('div.toast')
    expect(toast).toHaveClass('toast-error')
  })

  it('has alert role', () => {
    render(<Toast message="Alert" />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
