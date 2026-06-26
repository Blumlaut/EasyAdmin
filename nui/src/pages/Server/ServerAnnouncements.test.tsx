import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ServerAnnouncements } from './ServerAnnouncements'
import type { Permissions } from '../../types'

const wrap = (ui: React.ReactElement) => <>{ui}</>

const renderAnnouncements = (permissions: Permissions) =>
  render(wrap(<ServerAnnouncements permissions={permissions} />))

describe('ServerAnnouncements', () => {
  it('renders nothing without server.announce permission', () => {
    renderAnnouncements({})
    expect(screen.queryByText('Announcements')).not.toBeInTheDocument()
  })

  it('renders the section title with permission', () => {
    renderAnnouncements({ 'server.announce': true })
    expect(screen.getByText('Announcements')).toBeInTheDocument()
  })

  it('renders a textarea and send button', () => {
    renderAnnouncements({ 'server.announce': true })
    expect(screen.getByLabelText('Announcement message')).toBeInTheDocument()
    expect(screen.getByText('Send')).toBeInTheDocument()
  })

  it('disables the send button when textarea is empty', () => {
    renderAnnouncements({ 'server.announce': true })
    expect(screen.getByText('Send')).toBeDisabled()
  })

  it('enables the send button when textarea has content', async () => {
    const user = userEvent.setup()
    renderAnnouncements({ 'server.announce': true })
    const textarea = screen.getByLabelText('Announcement message')
    await user.type(textarea, 'Hello')
    expect(screen.getByText('Send')).not.toBeDisabled()
  })

  it('shows character count', () => {
    renderAnnouncements({ 'server.announce': true })
    expect(screen.getByText(/0 \/ 200/)).toBeInTheDocument()
  })
})
