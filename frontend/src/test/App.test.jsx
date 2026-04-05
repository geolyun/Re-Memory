import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

import App from '../App'

vi.mock('../pages/Landing', () => ({
  default: () => <div>Landing Page</div>,
}))

describe('App routing', () => {
  it('renders the landing route at the root path', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByText('Landing Page')).toBeInTheDocument()
    expect(screen.getByText('Re:Memory')).toBeInTheDocument()
  })
})
