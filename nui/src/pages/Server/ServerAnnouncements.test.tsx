import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ServerAnnouncements } from './ServerAnnouncements'

describe('ServerAnnouncements', () => {
  it('renders the section title', () => {
    render(<ServerAnnouncements onToast={() => {}} />)
    expect(screen.getByText('Announcements')).toBeInTheDocument()
  })

  it('opens the input prompt when send is clicked', async () => {
    const user = userEvent.setup()
    render(<ServerAnnouncements onToast={() => {}} />)
    await user.click(screen.getByText('Send announcement'))
    expect(screen.getByText('Server Announcement')).toBeInTheDocument()
  })
})
