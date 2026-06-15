import { render, screen } from '@testing-library/react'
import { Toast } from './Toast'

describe('Toast', () => {
  it('renders the message', () => {
    render(<Toast message="Action completed" />)
    expect(screen.getByText('Action completed')).toBeInTheDocument()
  })

  it('applies correct border color for info type', () => {
    const { container } = render(<Toast message="Info" type="info" />)
    // Check the raw style attribute for the CSS var reference
    const innerDiv = container.querySelectorAll('div')[1]
    expect(innerDiv?.getAttribute('style')).toContain('border-left')
    expect(innerDiv?.getAttribute('style')).toContain('--accent-blue')
  })

  it('applies correct border color for success type', () => {
    const { container } = render(<Toast message="Success" type="success" />)
    const innerDiv = container.querySelectorAll('div')[1]
    expect(innerDiv?.getAttribute('style')).toContain('border-left')
    expect(innerDiv?.getAttribute('style')).toContain('--accent-green')
  })

  it('applies correct border color for error type', () => {
    const { container } = render(<Toast message="Error" type="error" />)
    const innerDiv = container.querySelectorAll('div')[1]
    expect(innerDiv?.getAttribute('style')).toContain('border-left')
    expect(innerDiv?.getAttribute('style')).toContain('--accent-red')
  })

  it('defaults to info type', () => {
    const { container } = render(<Toast message="Default" />)
    const innerDiv = container.querySelectorAll('div')[1]
    expect(innerDiv?.getAttribute('style')).toContain('border-left')
    expect(innerDiv?.getAttribute('style')).toContain('--accent-blue')
  })
})
