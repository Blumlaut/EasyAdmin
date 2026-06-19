import { render, screen } from '@testing-library/react'
import type { ToastItem } from '../types'
import { Toast } from './Toast'

const makeToast = (overrides?: Partial<ToastItem>): ToastItem => ({
  id: 'test-toast',
  message: 'Test message',
  type: 'info',
  createdAt: performance.now(),
  duration: 5000,
  ...overrides,
})

describe('Toast', () => {
  it('renders the message', () => {
    render(<Toast toast={makeToast({ message: 'Player kicked' })} onDismiss={() => {}} />)
    expect(screen.getByText('Player kicked')).toBeInTheDocument()
  })

  it('applies info class by default', () => {
    render(<Toast toast={makeToast({ message: 'Info message' })} onDismiss={() => {}} />)
    const toast = screen.getByRole('alert')
    expect(toast).toHaveClass('toast--info')
  })

  it('applies success class', () => {
    render(<Toast toast={makeToast({ message: 'Action completed', type: 'success' })} onDismiss={() => {}} />)
    const toast = screen.getByRole('alert')
    expect(toast).toHaveClass('toast--success')
  })

  it('applies error class', () => {
    render(<Toast toast={makeToast({ message: 'Something failed', type: 'error' })} onDismiss={() => {}} />)
    const toast = screen.getByRole('alert')
    expect(toast).toHaveClass('toast--error')
  })

  it('applies warn class', () => {
    render(<Toast toast={makeToast({ message: 'Be careful', type: 'warn' })} onDismiss={() => {}} />)
    const toast = screen.getByRole('alert')
    expect(toast).toHaveClass('toast--warn')
  })

  it('has alert role', () => {
    render(<Toast toast={makeToast({ message: 'Alert' })} onDismiss={() => {}} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('shows EasyAdmin brand label', () => {
    render(<Toast toast={makeToast({ message: 'Test' })} onDismiss={() => {}} />)
    expect(screen.getByText('EasyAdmin')).toBeInTheDocument()
  })

  it('shows type label in header', () => {
    render(<Toast toast={makeToast({ message: 'Test', type: 'error' })} onDismiss={() => {}} />)
    const labels = screen.getAllByText('Error')
    expect(labels.length).toBeGreaterThanOrEqual(1)
  })

  it('calls onDismiss when dismiss button is clicked (after exit delay)', () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()
    render(<Toast toast={makeToast({ message: 'Dismiss me' })} onDismiss={onDismiss} />)
    const btn = screen.getByRole('button', { name: 'Dismiss notification' })
    btn.click()
    // Dismiss is deferred by EXIT_DELAY_MS (250ms)
    expect(onDismiss).not.toHaveBeenCalled()
    // Fast-forward past the delay
    vi.advanceTimersByTime(300)
    expect(onDismiss).toHaveBeenCalledWith('test-toast')
    vi.useRealTimers()
  })
})
