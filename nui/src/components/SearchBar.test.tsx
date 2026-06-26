import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchBar } from './SearchBar'

describe('SearchBar', () => {
  it('renders input with placeholder', () => {
    render(<SearchBar value="" onChange={() => {}} placeholder="Find players" />)
    expect(screen.getByPlaceholderText('Find players')).toBeInTheDocument()
  })

  it('calls onChange on input change', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SearchBar value="" onChange={onChange} />)
    await user.type(screen.getByLabelText('Search'), 'a')
    expect(onChange).toHaveBeenCalledWith('a')
  })

  it('shows result count', () => {
    render(
      <SearchBar
        value=""
        onChange={() => {}}
        resultCount={{ shown: 3, total: 10 }}
      />,
    )
    expect(screen.getByText('3/10')).toBeInTheDocument()
  })

  it('hides result count when not provided', () => {
    render(<SearchBar value="" onChange={() => {}} />)
    expect(screen.queryByText(/\d+\/\d+/)).not.toBeInTheDocument()
  })
})
