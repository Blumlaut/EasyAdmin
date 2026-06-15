import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BanDurationPicker } from './BanDurationPicker'

function ControlledPicker() {
  const [value, setValue] = useState<number | null>(null)
  return <BanDurationPicker value={value} onChange={setValue} />
}

describe('BanDurationPicker', () => {
  it('renders a select with preset options', () => {
    render(<ControlledPicker />)
    const select = screen.getByLabelText('Ban duration')
    expect(select).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '1 day' })).toBeInTheDocument()
  })

  it('does not include permanent when allowPermanent is false', () => {
    render(<BanDurationPicker value={null} onChange={() => {}} allowPermanent={false} />)
    expect(screen.queryByRole('option', { name: 'Permanent' })).not.toBeInTheDocument()
  })

  it('calls onChange when a preset is selected', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<BanDurationPicker value={null} onChange={onChange} />)
    await user.selectOptions(screen.getByLabelText('Ban duration'), '86400')
    expect(onChange).toHaveBeenCalledWith(86400)
  })

  it('opens the custom sub-modal when Custom... is chosen', async () => {
    const user = userEvent.setup()
    render(<ControlledPicker />)
    await user.selectOptions(screen.getByLabelText('Ban duration'), '-1')
    expect(screen.getByText('Custom Ban Length')).toBeInTheDocument()
  })
})
