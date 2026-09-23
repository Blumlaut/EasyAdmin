import { describe, it, expect, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { VersionBadge } from './VersionBadge'

describe('VersionBadge', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('renders nothing until the version is known', () => {
    const { container } = render(<VersionBadge version={null} />)
    expect(container.querySelector('.version-badge')).toBeNull()
  })

  it('shows the installed version without the update highlight', () => {
    const { container } = render(<VersionBadge version="8.0" />)
    const badge = container.querySelector('.version-badge')
    expect(badge?.textContent).toBe('v8.0')
    expect(badge?.classList.contains('version-badge--update')).toBe(false)
  })

  it('highlights the badge when an update is available', () => {
    const { container } = render(<VersionBadge version="8.0" latestVersion="8.1" updateAvailable />)
    const badge = container.querySelector('.version-badge')
    expect(badge?.classList.contains('version-badge--update')).toBe(true)
    expect(badge?.textContent).toContain('v8.0')
  })

  it('does not highlight when the update payload has no latest version', () => {
    const { container } = render(<VersionBadge version="8.0" updateAvailable />)
    expect(container.querySelector('.version-badge--update')).toBeNull()
  })

  it('does not double the "v" prefix on tagged versions', () => {
    const { container } = render(<VersionBadge version="v8.0" />)
    expect(container.querySelector('.version-badge-text')?.textContent).toBe('v8.0')
  })

  it('shows an update tooltip when hovering the highlighted badge', () => {
    render(<VersionBadge version="8.0" latestVersion="8.1" updateAvailable />)
    const trigger = document.querySelector('.ea-tooltip-trigger')
    expect(trigger).not.toBeNull()
    fireEvent.mouseEnter(trigger!)
    expect(document.querySelector('.ea-tooltip-popup')?.textContent).toContain('Update available')
  })

  it('has no tooltip when up to date', () => {
    render(<VersionBadge version="8.0" />)
    expect(document.querySelector('.ea-tooltip-trigger')).toBeNull()
  })
})
