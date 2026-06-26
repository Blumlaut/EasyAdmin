import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KeyValueTable } from './KeyValueTable'

describe('KeyValueTable', () => {
  it('renders all rows', () => {
    render(
      <KeyValueTable
        rows={[
          { key: 'Name', value: 'Alice' },
          { key: 'ID', value: 1, mono: true },
        ]}
      />,
    )
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('ID')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('shows em-dash for empty values', () => {
    render(
      <KeyValueTable
        rows={[{ key: 'Foo', value: '' }]}
      />,
    )
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('renders interactive rows as buttons', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <KeyValueTable
        rows={[{ key: 'Edit me', value: 'val', onClick, actionLabel: 'Edit' }]}
      />,
    )
    const button = screen.getByRole('button')
    await user.click(button)
    expect(onClick).toHaveBeenCalled()
  })
})
