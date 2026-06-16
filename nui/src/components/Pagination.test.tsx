import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Pagination } from './Pagination'

describe('Pagination', () => {
  it('renders nothing for a single page', () => {
    const { container } = render(
      <Pagination
        page={1}
        totalPages={1}
        onFirst={() => {}}
        onPrev={() => {}}
        onNext={() => {}}
        onLast={() => {}}
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows page info', () => {
    render(
      <Pagination
        page={2}
        totalPages={5}
        onFirst={() => {}}
        onPrev={() => {}}
        onNext={() => {}}
        onLast={() => {}}
      />,
    )
    expect(screen.getByText('2 / 5')).toBeInTheDocument()
  })

  it('hides prev/first on first page', () => {
    render(
      <Pagination
        page={1}
        totalPages={3}
        onFirst={() => {}}
        onPrev={() => {}}
        onNext={() => {}}
        onLast={() => {}}
      />,
    )
    expect(screen.queryByLabelText('Previous page')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('First page')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Next page')).toBeInTheDocument()
    expect(screen.getByLabelText('Last page')).toBeInTheDocument()
  })

  it('hides next/last on last page', () => {
    render(
      <Pagination
        page={3}
        totalPages={3}
        onFirst={() => {}}
        onPrev={() => {}}
        onNext={() => {}}
        onLast={() => {}}
      />,
    )
    expect(screen.queryByLabelText('Next page')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Last page')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Previous page')).toBeInTheDocument()
    expect(screen.getByLabelText('First page')).toBeInTheDocument()
  })

  it('calls onNext when next button is clicked', async () => {
    const user = userEvent.setup()
    const onNext = vi.fn()
    render(
      <Pagination
        page={1}
        totalPages={3}
        onFirst={() => {}}
        onPrev={() => {}}
        onNext={onNext}
        onLast={() => {}}
      />,
    )
    await user.click(screen.getByLabelText('Next page'))
    expect(onNext).toHaveBeenCalled()
  })
})
