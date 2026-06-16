import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ServerAnnouncements } from './ServerAnnouncements'
import { ModalProvider } from '../../ModalContext'

function wrap(ui: React.ReactElement) {
  return (
    <ModalProvider
      cleanupTypes={['cars']}
      onToast={() => {}}
    >
      {ui}
    </ModalProvider>
  )
}

describe('ServerAnnouncements', () => {
  it('renders the section title', () => {
    render(wrap(<ServerAnnouncements onToast={() => {}} />))
    expect(screen.getByText('Announcements')).toBeInTheDocument()
  })

  it('opens the input prompt when send is clicked', async () => {
    const user = userEvent.setup()
    render(wrap(<ServerAnnouncements onToast={() => {}} />))
    await user.click(screen.getByText('Send announcement'))
    expect(screen.getByText('Server Announcement')).toBeInTheDocument()
  })
})
