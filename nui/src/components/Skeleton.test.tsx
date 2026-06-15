import { render, screen } from '@testing-library/react'
import { Skeleton } from './Skeleton'

describe('Skeleton', () => {
  it('renders with the skeleton class', () => {
    render(<Skeleton data-testid="skeleton" />)
    const el = screen.getByTestId('skeleton')
    expect(el).toHaveClass('skeleton')
  })

  it('adds skeleton-circle class when circle is true', () => {
    render(<Skeleton data-testid="skeleton" circle />)
    expect(screen.getByTestId('skeleton')).toHaveClass('skeleton-circle')
  })

  it('applies width and height as inline styles', () => {
    render(<Skeleton data-testid="skeleton" width={100} height={20} />)
    const el = screen.getByTestId('skeleton') as HTMLElement
    expect(el.style.width).toBe('100px')
    expect(el.style.height).toBe('20px')
  })

  it('accepts string width/height', () => {
    render(<Skeleton data-testid="skeleton" width="50%" height="2em" />)
    const el = screen.getByTestId('skeleton') as HTMLElement
    expect(el.style.width).toBe('50%')
    expect(el.style.height).toBe('2em')
  })

  it('appends custom className', () => {
    render(<Skeleton data-testid="skeleton" className="my-skel" />)
    expect(screen.getByTestId('skeleton')).toHaveClass('skeleton')
    expect(screen.getByTestId('skeleton')).toHaveClass('my-skel')
  })
})
