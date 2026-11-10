import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import BrandLogo from './BrandLogo'

// Source of every layout component, to check the brand mark is the AKF logo everywhere
const layoutSources = import.meta.glob(['./*.jsx', '!./*.test.jsx'], {
  query: '?raw',
  import: 'default',
  eager: true,
})

describe('BrandLogo', () => {
  it('shows the local AKF emblem with the product name', () => {
    render(<BrandLogo />)
    const logo = screen.getByRole('img', { name: 'Aga Khan Foundation logo' })
    expect(logo.getAttribute('src')).toMatch(/akf-mark/)
    expect(screen.getByText('ESMS System')).toBeInTheDocument()
    expect(screen.getByText('Aga Khan Foundation – Syria')).toBeInTheDocument()
  })

  it('can show the emblem alone', () => {
    render(<BrandLogo showText={false} />)
    expect(screen.getByRole('img', { name: 'Aga Khan Foundation logo' })).toBeInTheDocument()
    expect(screen.queryByText('ESMS System')).not.toBeInTheDocument()
  })

  it('the layouts use it instead of the old leaf icon', () => {
    const files = Object.entries(layoutSources)
    expect(files.length).toBeGreaterThan(4)
    for (const [file, source] of files) {
      expect(source, file).not.toMatch(/material-symbols-outlined[^>]*>\s*eco\s*</)
    }
    for (const file of [
      './Header.jsx',
      './MainSidebar.jsx',
      './MobileMenu.jsx',
      './ProjectLayout.jsx',
      './SempFullWidthLayout.jsx',
    ]) {
      expect(layoutSources[file], file).toMatch(/<BrandLogo/)
    }
  })
})
