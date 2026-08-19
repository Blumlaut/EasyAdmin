import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SortableTable, type TableColumn } from './SortableTable'

interface Row {
  id: number
  name: string
  value: number
}

const rows: Row[] = [
  { id: 1, name: 'Alice', value: 10 },
  { id: 2, name: 'Bob', value: 20 },
]

const columns: TableColumn<Row>[] = [
  { key: 'name', label: 'Name', sortable: true, render: (r) => r.name },
  { key: 'value', label: 'Value', sortable: true, render: (r) => String(r.value) },
]

function bodyRows(container: HTMLElement): HTMLTableRowElement[] {
  return Array.from(container.querySelectorAll<HTMLTableRowElement>('tbody tr'))
}

describe('SortableTable', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('renders one body row per data item', () => {
    const { container } = render(
      <SortableTable columns={columns} rows={rows} getKey={(r) => String(r.id)} />,
    )
    const trs = bodyRows(container)
    expect(trs).toHaveLength(2)
    expect(trs[0].textContent).toContain('Alice')
    expect(trs[1].textContent).toContain('Bob')
  })

  it('rows are not focusable by default', () => {
    const { container } = render(
      <SortableTable columns={columns} rows={rows} getKey={(r) => String(r.id)} />,
    )
    for (const tr of bodyRows(container)) {
      expect(tr.tabIndex).toBe(-1)
      expect(tr).not.toHaveAttribute('data-nav-row')
    }
  })

  it('rowFocusable makes each body row a focusable grid item', () => {
    const { container } = render(
      <SortableTable columns={columns} rows={rows} getKey={(r) => String(r.id)} rowFocusable />,
    )
    const trs = bodyRows(container)
    expect(trs).toHaveLength(2)
    for (const tr of trs) {
      expect(tr.tabIndex).toBe(0)
      expect(tr).toHaveAttribute('data-nav-row')
    }
  })

  it('rowFocusable rows are tabbable in order', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <SortableTable columns={columns} rows={rows} getKey={(r) => String(r.id)} rowFocusable />,
    )
    const trs = bodyRows(container)

    act(() => { trs[0].focus() })
    await user.tab()
    expect(document.activeElement).toBe(trs[1])
  })

  it('shows the empty state when there are no rows', () => {
    render(
      <SortableTable columns={columns} rows={[]} getKey={() => ''} emptyMessage="Nothing here" />,
    )
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
  })

  it('onSortChange reports toggled sort state (controlled mode)', async () => {
    const user = userEvent.setup()
    const onSortChange = vi.fn()
    render(
      <SortableTable
        columns={columns}
        rows={rows}
        getKey={(r) => String(r.id)}
        sortBy="name"
        sortDir="asc"
        onSortChange={onSortChange}
      />,
    )

    // Clicking the active column toggles its direction
    await user.click(screen.getByRole('columnheader', { name: /Name/ }))
    expect(onSortChange).toHaveBeenCalledTimes(1)
    expect(onSortChange).toHaveBeenCalledWith({ sortBy: 'name', sortDir: 'desc' })

    // Clicking another column sorts it desc (data sorting is the consumer's job)
    await user.click(screen.getByRole('columnheader', { name: /Value/ }))
    expect(onSortChange).toHaveBeenLastCalledWith({ sortBy: 'value', sortDir: 'desc' })
  })
})
