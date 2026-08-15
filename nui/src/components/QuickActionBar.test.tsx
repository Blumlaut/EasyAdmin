import { describe, it, expect, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { QuickActionBar, type QuickAction, type DropdownAction } from './QuickActionBar'
import { ListItem } from './ListItem'
import { useGridNavigation } from '../hooks/useGridNavigation'

/** Same selector useGridNavigation uses by default. */
const GRID_SELECTOR = '[role="button"], button'

function makeActions(count: number): QuickAction[] {
  return Array.from({ length: count }, (_, i) => ({
    label: `Action ${i + 1}`,
    icon: 'log-out',
    onClick: () => {},
  }))
}

function makeDropdownActions(count: number): DropdownAction[] {
  return Array.from({ length: count }, (_, i) => ({
    label: `Drop ${i + 1}`,
    icon: 'zap',
    onSelect: () => {},
  }))
}

function dispatchKey(key: string) {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
}

describe('QuickActionBar', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('renders all quick actions and the dropdown trigger', () => {
    const { container } = render(
      <QuickActionBar actions={makeActions(3)} dropdownActions={makeDropdownActions(2)} />,
    )
    expect(container.querySelectorAll('.quick-action-btn').length).toBe(4)
  })

  it('renders nothing when there are no actions', () => {
    const { container } = render(<QuickActionBar actions={[]} dropdownActions={[]} />)
    expect(container.querySelector('.quick-action-bar')).toBeNull()
  })

  it('exposes exactly one grid item per action, including the dropdown trigger', () => {
    // Regression: the dropdown trigger was once wrapped in a focusable
    // div[role=button], which double-counted it and misaligned grid rows.
    const { container } = render(
      <QuickActionBar actions={makeActions(4)} dropdownActions={makeDropdownActions(2)} />,
    )
    const gridItems = container.querySelectorAll(GRID_SELECTOR)
    expect(gridItems.length).toBe(5) // 4 quick + 1 dropdown trigger
  })

  describe('grid navigation integration', () => {
    function renderPlayerLikeList(rows: number) {
      function Row({ index }: { index: number }) {
        const quick = makeActions(2)
        const drop = makeDropdownActions(2)
        return (
          <ListItem onClick={() => {}}>
            <span>player-{index}</span>
            <QuickActionBar actions={quick} dropdownActions={drop} />
          </ListItem>
        )
      }

      function Grid() {
        const listRef = useGridNavigation(() => 4) // body + 2 quick + dropdown
        return (
          <div ref={listRef}>
            {Array.from({ length: rows }, (_, i) => (
              <Row key={i} index={i} />
            ))}
          </div>
        )
      }

      const { container } = render(<Grid />)
      const rowBodies = Array.from(
        container.querySelectorAll<HTMLElement>('.list-item-interactive'),
      )
      return { container, rowBodies }
    }

    it('ArrowDown from a row body lands on the next row body (not the same row)', () => {
      const { rowBodies } = renderPlayerLikeList(3)

      act(() => { rowBodies[0].focus() })
      act(() => { dispatchKey('ArrowDown') })
      expect(document.activeElement).toBe(rowBodies[1])

      act(() => { dispatchKey('ArrowDown') })
      expect(document.activeElement).toBe(rowBodies[2])

      // Bottom row — stays
      act(() => { dispatchKey('ArrowDown') })
      expect(document.activeElement).toBe(rowBodies[2])
    })

    it('ArrowRight/ArrowLeft traverse the action buttons of a row', () => {
      const { rowBodies } = renderPlayerLikeList(2)

      act(() => { rowBodies[0].focus() })
      // body -> quick1 -> quick2 -> dropdown trigger
      act(() => { dispatchKey('ArrowRight') })
      act(() => { dispatchKey('ArrowRight') })
      act(() => { dispatchKey('ArrowRight') })
      expect(document.activeElement).toBe(rowBodies[0].querySelectorAll(GRID_SELECTOR)[2])
      expect((document.activeElement as HTMLElement).classList.contains('quick-action-btn--dropdown')).toBe(true)

      // Back to the body
      act(() => { dispatchKey('ArrowLeft') })
      act(() => { dispatchKey('ArrowLeft') })
      act(() => { dispatchKey('ArrowLeft') })
      expect(document.activeElement).toBe(rowBodies[0])
    })

    it('ArrowUp/ArrowDown preserve the zone across rows', () => {
      const { rowBodies } = renderPlayerLikeList(2)

      act(() => { rowBodies[0].focus() })
      act(() => { dispatchKey('ArrowRight') }) // zone 1 (first quick action)
      act(() => { dispatchKey('ArrowDown') })
      // Note: querySelectorAll on the row excludes the row body itself,
      // so [0] is the first quick action button.
      expect(document.activeElement).toBe(rowBodies[1].querySelectorAll(GRID_SELECTOR)[0])
    })
  })
})
